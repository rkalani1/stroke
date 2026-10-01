import { build } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { packGuideline } from './guideline-data-pack.mjs';
import { atomicWriteFile } from './atomic-write.mjs';
import { runClinicalClaimCheck } from './check-clinical-claims.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Public-demo gating is decided at build time (see src/build-flags.js). The
// default build — the one committed and deployed to GitHub Pages — is always a
// synthetic public demo. Only an explicit STROKE_BUILD_TARGET=private produces a
// bundle that can leave demo mode, and it must never be committed to main.
const buildTarget = (process.env.STROKE_BUILD_TARGET || 'public').toLowerCase();
if (!['public', 'private'].includes(buildTarget)) {
  throw new Error(`STROKE_BUILD_TARGET must be "public" or "private" (got "${buildTarget}")`);
}
const publicDemoBuild = buildTarget !== 'private';
const outfile = process.env.STROKE_BUILD_OUTFILE || 'app.js';
const entryFile = path.resolve(root, outfile);
const outdir = path.dirname(entryFile);
const relativeOutput = path.relative(root, entryFile);
if (!publicDemoBuild && !relativeOutput.startsWith(`..${path.sep}`) && !path.isAbsolute(relativeOutput)) {
  throw new Error('Refusing to write a private (non-demo) build inside the deployed tree; set STROKE_BUILD_OUTFILE to a path outside the deployed tree.');
}
const codecPath = path.join(root, 'src/guideline-data-codec.js');
const clinicalReview = runClinicalClaimCheck(root);
if (!clinicalReview.ok) {
  throw new Error('Clinical claim review must pass before publishing browser modules:\n' + clinicalReview.findings
    .map(item => `[${item.severity}] ${item.code}: ${item.message}\n  ${item.affected.join('\n  ')}`).join('\n'));
}

const result = await build({
  absWorkingDir: root,
  entryPoints: [{ in: 'src/app.jsx', out: path.basename(entryFile, '.js') }],
  bundle: true,
  format: 'esm',
  splitting: true,
  target: 'es2018',
  minify: true,
  outdir,
  chunkNames: 'chunks/[name]-[hash]',
  metafile: true,
  write: false,
  define: { __STROKE_BUILD_PUBLIC_DEMO__: JSON.stringify(publicDemoBuild) },
  logLevel: 'info',
  plugins: [{
    name: 'lossless-guideline-columns',
    setup(build) {
      build.onLoad({ filter: /[/\\]src[/\\]guidelines[/\\][^/\\]+\.json$/ }, async ({ path: file }) => {
        const guideline = JSON.parse(await fs.readFile(file, 'utf8'));
        if (!Array.isArray(guideline.recommendations)) return;
        return {
          loader: 'js',
          contents: `import { unpackGuideline } from ${JSON.stringify(codecPath)}; export default unpackGuideline(${JSON.stringify(packGuideline(guideline))});`
        };
      });
    }
  }]
});

const packageJson = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
const outputs = result.metafile.outputs;
const entryOutput = Object.keys(outputs).find(name => path.resolve(root, name) === entryFile);
if (!entryOutput) throw new Error('Browser entry is missing from build output');
const initial = new Set();
function visit(name) {
  if (initial.has(name)) return;
  initial.add(name);
  for (const dependency of outputs[name].imports) {
    if (!dependency.external && dependency.kind !== 'dynamic-import') visit(dependency.path);
  }
}
visit(entryOutput);
const relativeAsset = name => path.relative(outdir, path.resolve(root, name)).split(path.sep).join('/');
const manifest = {
  schemaVersion: 1,
  appVersion: packageJson.version,
  buildTarget,
  entry: relativeAsset(entryOutput),
  initial: [...initial].map(relativeAsset).sort(),
  files: result.outputFiles.map(file => ({
    path: path.relative(outdir, file.path).split(path.sep).join('/'),
    bytes: file.contents.byteLength,
    gzipBytes: gzipSync(file.contents, { level: 9 }).byteLength,
    sha256: createHash('sha256').update(file.contents).digest('hex')
  })).sort((a, b) => a.path.localeCompare(b.path))
};
const manifestPath = path.join(outdir, 'app-assets.json');
let previous = null;
try { previous = JSON.parse(await fs.readFile(manifestPath, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
// Write dependencies first, then the entry. A failed build never advertises
// missing chunks, and the worker publishes the complete new list last.
for (const file of [...result.outputFiles].sort((a, b) => Number(a.path === entryFile) - Number(b.path === entryFile))) {
  await atomicWriteFile(file.path, file.contents);
}
await atomicWriteFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
if (entryFile === path.join(root, 'app.js')) {
  const workerPath = path.join(root, 'service-worker.js');
  const worker = await fs.readFile(workerPath, 'utf8');
  const marker = /\/\/ BEGIN GENERATED APP CHUNKS[\s\S]*?\/\/ END GENERATED APP CHUNKS/;
  if (!marker.test(worker)) throw new Error('Generated chunk marker is missing from service-worker.js');
  const chunks = manifest.files.filter(file => file.path !== manifest.entry).map(file => `./${file.path}`);
  await atomicWriteFile(workerPath, worker.replace(marker, '// BEGIN GENERATED APP CHUNKS\nconst APP_CHUNKS = ' + JSON.stringify(chunks, null, 2) + ';\n// END GENERATED APP CHUNKS'));
}
// Only previous generated hashed chunks may be removed. No other asset tree
// is touched, including when building an isolated/private candidate.
for (const file of previous?.files || []) {
  if (/^chunks\/[A-Za-z0-9_-]+-[A-Z0-9]+\.js$/.test(file.path) && !manifest.files.some(next => next.path === file.path)) {
    for (const suffix of ['', '.gz', '.br']) await fs.rm(path.join(outdir, file.path + suffix), { force: true });
  }
}
console.log(`Browser modules: ${manifest.initial.length} initial / ${manifest.files.length} offline; manifest ${path.relative(root, manifestPath)}`);
