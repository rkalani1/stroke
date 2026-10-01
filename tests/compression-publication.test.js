import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { gzipSync, gunzipSync, brotliCompressSync, brotliDecompressSync, constants } from 'node:zlib';

const root = path.resolve(__dirname, '..');
const encode = {
  gz: bytes => gzipSync(bytes, { level: 9 }),
  br: bytes => brotliCompressSync(bytes, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }),
};
const decode = { gz: gunzipSync, br: brotliDecompressSync };

function runCompressor(fixture) {
  const child = spawn(process.execPath, ['scripts/compress-assets.mjs'], { cwd: fixture });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', bytes => { stdout += bytes; });
  child.stderr.on('data', bytes => { stderr += bytes; });
  const done = new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', code => resolve({ code, stdout, stderr }));
  });
  return { child, done };
}

describe('compressed asset publication', () => {
  it('keeps gzip and Brotli complete during concurrent real compressor runs and publishes exactly the manifest asset set', async () => {
    const fixture = await fs.mkdtemp(path.join(os.tmpdir(), 'stroke-compression-'));
    const processes = [];
    try {
      await fs.mkdir(path.join(fixture, 'scripts'));
      await fs.mkdir(path.join(fixture, 'chunks'));
      for (const file of ['compress-assets.mjs', 'atomic-write.mjs']) {
        await fs.copyFile(path.join(root, 'scripts', file), path.join(fixture, 'scripts', file));
      }
      // Incompressible input keeps the real quality-11 writer active while
      // readers inspect the public paths. Production assets are never touched.
      const sources = new Map([
        ['app.js', Buffer.from(`export const app = "${randomBytes(192 * 1024).toString('base64')}";\n`)],
        ['chunks/reference-current.js', Buffer.from(`export const reference = "${randomBytes(48 * 1024).toString('base64')}";\n`)],
        ...['tailwind.css', 'index.html', 'manifest.json', 'service-worker.js'].map(file => [file, Buffer.from(`current ${file}\n`.repeat(128))]),
      ]);
      const tiny = 'chunks/tiny-current.js';
      const manifest = {
        schemaVersion: 1, appVersion: '0.0.0', buildTarget: 'public', entry: 'app.js', initial: ['app.js'],
        files: [...sources.entries()].filter(([file]) => file.endsWith('.js') && file !== 'service-worker.js')
          .map(([file, bytes]) => ({ path: file, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }))
          .concat({ path: tiny, bytes: 17, sha256: 'fixture-tiny-file' }),
      };
      sources.set('app-assets.json', Buffer.from(JSON.stringify(manifest, null, 2)));
      expect(sources.get('app-assets.json').length).toBeGreaterThanOrEqual(512);

      const previous = new Map();
      for (const [file, bytes] of sources) {
        await fs.writeFile(path.join(fixture, file), bytes);
        const old = Buffer.from(`previous complete ${file}\n`.repeat(128));
        previous.set(file, old);
        for (const ext of Object.keys(encode)) await fs.writeFile(path.join(fixture, `${file}.${ext}`), encode[ext](old));
      }
      const untouched = new Map([
        [tiny, Buffer.from('export default 1;')],
        ['chunks/retired.js', Buffer.from('unlisted source must not be compressed\n'.repeat(128))],
        ['chunks/retired.js.gz', Buffer.from('retain unrelated gzip artifact')],
        ['chunks/retired.js.br', Buffer.from('retain unrelated Brotli artifact')],
      ]);
      for (const [file, bytes] of untouched) await fs.writeFile(path.join(fixture, file), bytes);

      processes.push(runCompressor(fixture), runCompressor(fixture));
      let writersFinished = false;
      const completed = Promise.all(processes.map(process => process.done)).finally(() => { writersFinished = true; });
      let observations = 0;
      let passesWhileWriting = 0;
      do {
        if (!writersFinished) passesWhileWriting += 1;
        for (const [file, current] of sources) {
          for (const ext of Object.keys(decode)) {
            const compressed = await fs.readFile(path.join(fixture, `${file}.${ext}`));
            const observed = decode[ext](compressed);
            expect(observed.equals(previous.get(file)) || observed.equals(current), `${file}.${ext} must be one complete snapshot`).toBe(true);
            observations += 1;
          }
        }
      } while (!writersFinished);
      const results = await completed;
      expect(passesWhileWriting).toBeGreaterThan(1);
      expect(observations).toBeGreaterThan(sources.size * 2);
      for (const result of results) {
        expect(result.code, result.stderr).toBe(0);
        expect(result.stdout).toContain(`Compressed ${sources.size} file(s), skipped 1.`);
      }
      for (const [file, bytes] of sources) {
        expect(await fs.readFile(path.join(fixture, file))).toEqual(bytes);
        for (const ext of Object.keys(encode)) {
          const compressed = await fs.readFile(path.join(fixture, `${file}.${ext}`));
          expect(decode[ext](compressed), `${file}.${ext} round trip`).toEqual(bytes);
          expect(compressed, `${file}.${ext} compression options`).toEqual(encode[ext](bytes));
        }
      }
      for (const [file, bytes] of untouched) expect(await fs.readFile(path.join(fixture, file))).toEqual(bytes);
      for (const ext of Object.keys(encode)) await expect(fs.stat(path.join(fixture, `${tiny}.${ext}`))).rejects.toMatchObject({ code: 'ENOENT' });
      const published = [...await fs.readdir(fixture), ...(await fs.readdir(path.join(fixture, 'chunks'))).map(file => `chunks/${file}`)]
        .filter(file => file !== 'scripts' && file !== 'chunks').sort();
      const expected = [...sources.keys()].flatMap(file => [file, `${file}.gz`, `${file}.br`]).concat([...untouched.keys()]).sort();
      expect(published).toEqual(expected);
    } finally {
      for (const process of processes) if (process.child.exitCode === null) process.child.kill();
      await Promise.allSettled(processes.map(process => process.done));
      await fs.rm(fixture, { recursive: true, force: true });
    }
  }, 30000);
});
