import { describe, expect, it } from 'vitest';
import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
describe('Encounter-first browser module graph', () => {
  it('keeps reference code/data out of the initial graph and shares one React runtime', async () => {
    const result = await build({
      absWorkingDir: root,
      entryPoints: ['src/app.jsx'],
      outdir: 'unused-module-graph-test',
      bundle: true, splitting: true, format: 'esm', target: 'es2018',
      write: false, metafile: true, minify: true,
      define: { __STROKE_BUILD_PUBLIC_DEMO__: 'true' }
    });
    const outputs = result.metafile.outputs;
    const initial = new Set();
    const visit = name => {
      if (initial.has(name)) return;
      initial.add(name);
      for (const dependency of outputs[name].imports) if (!dependency.external && dependency.kind !== 'dynamic-import') visit(dependency.path);
    };
    visit(Object.keys(outputs).find(name => outputs[name].entryPoint === 'src/app.jsx'));
    const initialInputs = new Set([...initial].flatMap(name => Object.keys(outputs[name].inputs)));
    expect(initialInputs.has('src/evidence/activeTrials.js')).toBe(true);
    expect(initialInputs.has('src/evidence/claims.js')).toBe(true);
    for (const deferred of ['src/education.jsx', 'src/evidence/completedTrials.js', 'src/guideline-library.js', 'content/search-index.json', 'src/components/TrialScreener.jsx', 'src/components/EligibilityTables.jsx']) {
      expect(initialInputs.has(deferred), `${deferred} must load only on request`).toBe(false);
      expect(Object.keys(result.metafile.inputs)).toContain(deferred);
    }
    expect([...initialInputs].filter(name => name.startsWith('src/guidelines/'))).toEqual([]);
    const reactCopies = Object.values(outputs).filter(output => Object.keys(output.inputs).some(input => /node_modules\/react\/cjs\/react\.production\.min\.js$/.test(input)));
    expect(reactCopies).toHaveLength(1);
    expect(Object.values(outputs).some(output => output.entryPoint === 'src/design/sw-controller.js')).toBe(true);
  });
});
