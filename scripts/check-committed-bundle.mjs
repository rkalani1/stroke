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
// preload and chunk lists are ordered by hashed name). The worker's precache SHA-256 values
// change with chunk names, so they are compared separately below, against the bytes they cover.
const checksumLine = /^(\s*"[^"]+": )"[0-9a-f]{64}"(,?)$/;
for (const file of ['index.html', 'service-worker.js']) {
  const lines = text => normalize(text).replace(/\r\n/g, '\n').split('\n').map(line => line.replace(checksumLine, '$1"#"$2')).sort().join('\n');
  if (lines(committed(file)) !== lines(built(file))) problems.push(`${file} differs from a build of the committed source`);
}

// The committed worker refuses to install unless every precached file it fetches from Pages
// matches its table, so the table must describe the committed bytes exactly.
const committedBytes = file => execFileSync('git', ['show', `${ref}:${file}`], { maxBuffer: 64 * 1024 * 1024 });
const table = committed('service-worker.js').match(/const PRECACHE_SHA256 = (\{[\s\S]*?\});/);
if (!table) problems.push('service-worker.js has no PRECACHE_SHA256 table');
else {
  const expected = JSON.parse(table[1]);
  const worker = committed('service-worker.js');
  // eslint-disable-next-line no-new-func
  const core = new Function(`return ${worker.match(/const CORE_ASSETS = (\[[\s\S]*?\]);/)[1]}`)();
  const precache = [...core, ...JSON.parse(worker.match(/const APP_CHUNKS = (\[[\s\S]*?\]);/)[1])];
  if (JSON.stringify(Object.keys(expected).sort()) !== JSON.stringify([...new Set(precache)].sort())) problems.push('PRECACHE_SHA256 does not list exactly the precached files');
  for (const asset of precache) {
    let actual = null;
    try { actual = sha(committedBytes(asset === './' ? 'index.html' : asset.slice(2))); } catch { /* reported below */ }
    if (actual !== expected[asset]) problems.push(`PRECACHE_SHA256 entry for ${asset} does not match the committed file`);
  }
}

if (problems.length) {
  console.error('COMMITTED BUNDLE CHECK FAILED: the committed artifact (served by GitHub Pages) is not the build of the committed source.');
  for (const problem of problems) console.error(`- ${problem}`);
  console.error('Run `npm run build:prod` and commit app.js, app-assets.json, chunks/, index.html and service-worker.js.');
  process.exit(1);
}
console.log(`Committed bundle check: PASS (${want.length} JavaScript files, index.html and service-worker.js match a build of ${ref}; precache checksums match the committed files)`);
