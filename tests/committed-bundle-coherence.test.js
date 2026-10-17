// What GitHub Pages serves is the committed tree, not a CI rebuild. These checks read the
// committed generated files only (no build) and catch a partly replaced bundle (SPS-04: chunks
// swapped without the files that reference them) and a tracked root folder that would become
// public on the branch-root Jekyll deploy because _config.yml was not regenerated (SPS-14).
// Files are read from the git index, not the working tree: other tests rebuild the tree in
// place while the suite runs, and the index is what a commit (and so Pages) will hold.
import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const read = rel => git('show', `:${rel}`);
const tracked = git('ls-files').split('\n').filter(Boolean);
// The same module-name shape the service worker checks at install.
const references = text => [...text.matchAll(/[/"]([A-Za-z][A-Za-z0-9_]*-[A-Z0-9]{8}\.js)\b/g)].map(match => match[1]);

describe('committed browser bundle', () => {
  const manifest = JSON.parse(read('app-assets.json'));
  const listed = new Set(manifest.files.map(file => file.path));
  const workerChunks = JSON.parse(read('service-worker.js').match(/const APP_CHUNKS = (\[[\s\S]*?\]);/)[1]).map(chunk => chunk.replace(/^\.\//, ''));

  it('lists exactly the committed chunk files in the manifest and the worker', () => {
    const onDisk = tracked.filter(file => /^chunks\/[^/]+\.js$/.test(file)).sort();
    expect([...listed].filter(file => file !== manifest.entry).sort()).toEqual(onDisk);
    expect([...workerChunks].sort()).toEqual(onDisk);
  });

  it('references only modules that exist and are precached', () => {
    const problems = [];
    for (const file of ['index.html', 'app.js', ...workerChunks]) {
      for (const name of references(read(file))) {
        if (!tracked.includes(`chunks/${name}`) || !workerChunks.includes(`chunks/${name}`)) problems.push(`${file} -> ${name}`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('preloads exactly the initial graph from index.html', () => {
    const preloads = [...read('index.html').matchAll(/<link rel="modulepreload" href="(chunks\/[^"]+)">/g)].map(match => match[1]).sort();
    expect(preloads).toEqual(manifest.initial.filter(file => file !== manifest.entry).sort());
  });
});

describe('branch-root Pages exclusions', () => {
  it('excludes every tracked top-level entry that is not an allowlisted public root', () => {
    const stage = read('scripts/publish-stage.mjs');
    const rootFiles = JSON.parse(stage.match(/const rootFiles = (\[[^\]]*\]);/)[1].replace(/'/g, '"'));
    const publicRoots = new Set([...rootFiles, 'chunks', 'assets', 'data']);
    expect(stage).toContain("export const PUBLIC_ROOTS = [...rootFiles, 'chunks', 'assets', 'data'];");
    const excluded = new Set(read('_config.yml').split('\n').filter(line => line.startsWith('  - ')).map(line => line.slice(4).replace(/\/$/, '')));
    const roots = [...new Set(tracked.map(file => file.split('/')[0]))];
    const exposed = roots.filter(name => !name.startsWith('.') && name !== '_config.yml' && !publicRoots.has(name)
      && !rootFiles.some(file => name === `${file}.gz` || name === `${file}.br`) && !excluded.has(name));
    expect(exposed).toEqual([]);
  });
});
