import { build } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { packGuideline } from './guideline-data-pack.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const codecPath = path.join(root, 'src/guideline-data-codec.js');

await build({
  absWorkingDir: root,
  entryPoints: ['src/app.jsx'],
  bundle: true,
  format: 'iife',
  target: 'es2018',
  minify: true,
  outfile: 'app.js',
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
