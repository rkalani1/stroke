// Committed bundle = build from committed source.
//
// GitHub Pages serves the committed app.js, chunks/, index.html and
// service-worker.js, while CI tests its own fresh build. Run this after
// `npm run build` in a clean checkout: it compares the fresh build with the
// committed files (`git show HEAD:<path>`). esbuild chunk names depend on
// module paths, so names differ between machines while every byte of code is
// identical; names are normalized before comparing.
//
// Usage: node scripts/check-committed-bundle.mjs [--ref HEAD]

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const ref = process.argv.includes('--ref') ? process.argv[process.argv.indexOf('--ref') + 1] : 'HEAD';
const sha = text => createHash('sha256').update(text).digest('hex');
// chunks/chunk-ABCD1234.js, chunks/Trials-ABCD1234.js → chunks/chunk-#.js
const normalize = text => text.replace(/\b([A-Za-z][A-Za-z0-9]*)-[A-Z0-9]{8}\.js\b/g, '$1-#.js');
const committed = file => execFileSync('git', ['show', `${ref}:${file}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const built = file => readFileSync(path.join(process.cwd(), file), 'utf8');

const problems = [];
const committedManifest = JSON.parse(committed('app-assets.json'));
const builtManifest = JSON.parse(built('app-assets.json'));
if (committedManifest.appVersion !== builtManifest.appVersion) problems.push(`app version ${committedManifest.appVersion} committed vs ${builtManifest.appVersion} built`);
if (committedManifest.buildTarget !== builtManifest.buildTarget) problems.push(`build target ${committedManifest.buildTarget} committed vs ${builtManifest.buildTarget} built`);

// JavaScript: the multiset of normalized file contents must match exactly.
const contents = (manifest, read) => manifest.files.map(entry => `${normalize(entry.path)} ${sha(normalize(read(entry.path)))}`).sort();
const want = contents(committedManifest, committed), got = contents(builtManifest, built);
if (want.length !== got.length) problems.push(`${want.length} committed JavaScript files vs ${got.length} built`);
const missing = want.filter(line => !got.includes(line)), extra = got.filter(line => !want.includes(line));
for (const line of missing) problems.push(`committed file has no identical build output: ${line.split(' ')[0]}`);
for (const line of extra) problems.push(`build output differs from the committed bundle: ${line.split(' ')[0]}`);
if (normalize(JSON.stringify(committedManifest.initial.map(normalize).sort())) !== normalize(JSON.stringify(builtManifest.initial.map(normalize).sort()))) problems.push('initial module graph differs');

// HTML shell and worker: compare normalized lines as a sorted multiset (generated
// preload and chunk lists are ordered by hashed name).
for (const file of ['index.html', 'service-worker.js']) {
  const lines = text => normalize(text).replace(/\r\n/g, '\n').split('\n').sort().join('\n');
  if (lines(committed(file)) !== lines(built(file))) problems.push(`${file} differs from a build of the committed source`);
}

if (problems.length) {
  console.error('COMMITTED BUNDLE CHECK FAILED: the committed artifact (served by GitHub Pages) is not the build of the committed source.');
  for (const problem of problems) console.error(`- ${problem}`);
  console.error('Run `npm run build:prod` and commit app.js, app-assets.json, chunks/, index.html and service-worker.js.');
  process.exit(1);
}
console.log(`Committed bundle check: PASS (${want.length} JavaScript files, index.html and service-worker.js match a build of ${ref})`);
