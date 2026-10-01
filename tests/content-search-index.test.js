import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { build } from 'esbuild';
import { getSearchIndex as getFullSearchIndex } from '../src/content-context.js';
import { getBrowserSearchIndex } from '../src/content-search-index.js';
import { projectContentSearchEntries, copyContentSearchEntries } from '../src/content-search-projection.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('compact browser search projection', () => {
  it('preserves all 377 entries, five search/navigation fields, and ordering', () => {
    const full = getFullSearchIndex();
    expect(full).toHaveLength(377);
    const projected = getBrowserSearchIndex();
    expect(projected).toEqual(full.map(({ record, ...entry }) => entry));
    expect(projected.map(entry => Object.keys(entry))).toEqual(
      full.map(({ record, ...entry }) => Object.keys(entry))
    );
    expect(full.every(entry => entry.record && entry.record.id === entry.id)).toBe(true);
    expect(projected.every(entry => !Object.hasOwn(entry, 'record'))).toBe(true);
  });

  it('returns independent arrays and entry objects without mutating either source', () => {
    const first = getBrowserSearchIndex();
    first[0].title = 'mutated test entry';
    first.pop();
    const next = getBrowserSearchIndex();
    expect(next).toHaveLength(377);
    expect(next[0].title).toBe(getFullSearchIndex()[0].title);
  });

  it('restores explicit undefined fields after JSON serialization without changing null', () => {
    const projected = projectContentSearchEntries({
      guidelines: [{ id: 'g', statement: null, guideline: 'Example', COR: null }],
      trials: [{ id: 't' }],
      education: [{ id: 'e' }],
      calculators: [{ id: 'c' }],
      references: [{ id: 'r' }]
    });
    const restored = copyContentSearchEntries(JSON.parse(JSON.stringify(projected)));
    expect(restored).toEqual(projected);
    for (const entry of restored) {
      expect(Object.keys(entry)).toEqual(['domain', 'id', 'title', 'subtitle', 'keywords']);
    }
    expect(restored[0].title).toBeNull();
    expect(restored[0].keywords).toBeUndefined();
    expect(restored[0].subtitle).toBe('Example · null/undefined');
    expect(restored[2].keywords).toBe('');
  });

  it('excludes the full content bundle from the browser accessor build graph', async () => {
    const result = await build({
      absWorkingDir: root, entryPoints: ['src/content-search-index.js'],
      bundle: true, write: false, metafile: true, format: 'iife',
      outfile: 'unused-test-output.js'
    });
    expect(Object.keys(result.metafile.inputs)).toContain('content/search-index.json');
    expect(Object.keys(result.metafile.inputs)).not.toContain('content/bundle.json');
    expect(Object.keys(result.metafile.inputs)).not.toContain('src/content-context.js');
  });

  it('checks both generated artifacts and detects stale compact data independently', () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'stroke-search-projection-'));
    try {
      for (const file of ['scripts/build-content-bundle.mjs', 'content/schema.mjs', 'src/content-search-projection.js']) {
        fs.mkdirSync(path.dirname(path.join(temp, file)), { recursive: true });
        fs.copyFileSync(path.join(root, file), path.join(temp, file));
      }
      fs.writeFileSync(path.join(temp, 'package.json'), '{"type":"module"}');
      fs.mkdirSync(path.join(temp, 'content/trials'));
      fs.writeFileSync(path.join(temp, 'content/trials/example.json'), JSON.stringify([
        { id: 'example', name: 'Example trial', finding: 'Scoped summary', category: 'example', sourceUrl: 'https://example.org/primary' }
      ]));
      const run = (...args) => spawnSync(process.execPath, ['scripts/build-content-bundle.mjs', ...args], { cwd: temp, encoding: 'utf8' });
      expect(run().status).toBe(0);
      const fullBefore = fs.readFileSync(path.join(temp, 'content/bundle.json'), 'utf8');
      expect(run('--check').status).toBe(0);
      fs.writeFileSync(path.join(temp, 'content/search-index.json'), '[]\n');
      const staleSearch = run('--check');
      expect(staleSearch.status).toBe(1);
      expect(staleSearch.stderr).toContain('content/search-index.json is stale');
      expect(fs.readFileSync(path.join(temp, 'content/bundle.json'), 'utf8')).toBe(fullBefore);
      expect(run().status).toBe(0);
      fs.writeFileSync(path.join(temp, 'content/bundle.json'), '{}\n');
      const staleFull = run('--check');
      expect(staleFull.status).toBe(1);
      expect(staleFull.stderr).toContain('content/bundle.json is stale');
    } finally {
      fs.rmSync(temp, { recursive: true, force: true });
    }
  });
});
