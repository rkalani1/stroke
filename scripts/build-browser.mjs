import { build } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { packGuideline } from './guideline-data-pack.mjs';

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
if (!publicDemoBuild && path.resolve(root, outfile) === path.resolve(root, 'app.js')) {
  throw new Error('Refusing to write a private (non-demo) build to the committed app.js; set STROKE_BUILD_OUTFILE to a path outside the deployed tree.');
}
const codecPath = path.join(root, 'src/guideline-data-codec.js');

await build({
  absWorkingDir: root,
  entryPoints: ['src/app.jsx'],
  bundle: true,
  format: 'iife',
  target: 'es2018',
  minify: true,
  outfile,
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
