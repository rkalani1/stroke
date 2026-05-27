#!/usr/bin/env node
// Pre-compresses bundled assets to .gz (and .br when zlib supports it)
// so a static host (e.g. GitHub Pages with brotli, or nginx) can serve the
// pre-compressed file directly. Runs after `npm run build`.
//
// Safe no-op on CI systems without brotli support — gzip is always emitted.

import { promises as fs } from 'node:fs';
import { createGzip, createBrotliCompress, constants as zlibConstants } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);

const TARGETS = [
  'app.js',
  'tailwind.css',
  'index.html',
  'manifest.json',
  'service-worker.js'
];

async function fileSize(p) {
  try {
    const s = await fs.stat(p);
    return s.size;
  } catch {
    return null;
  }
}

async function compressGzip(src, dest) {
  await pipeline(createReadStream(src), createGzip({ level: 9 }), createWriteStream(dest));
}

async function compressBrotli(src, dest) {
  const brotli = createBrotliCompress({
    params: {
      [zlibConstants.BROTLI_PARAM_QUALITY]: 11
    }
  });
  await pipeline(createReadStream(src), brotli, createWriteStream(dest));
}

async function main() {
  let ok = 0;
  let skipped = 0;
  for (const rel of TARGETS) {
    const src = path.join(ROOT, rel);
    const size = await fileSize(src);
    if (size == null) {
      skipped += 1;
      console.log(`skip ${rel} (not found)`);
      continue;
    }
    if (size < 512) {
      // Not worth compressing
      skipped += 1;
      continue;
    }
    await compressGzip(src, `${src}.gz`);
    await compressBrotli(src, `${src}.br`);
    const gzSize = await fileSize(`${src}.gz`);
    const brSize = await fileSize(`${src}.br`);
    const pct = (n) => (n != null ? `${((n / size) * 100).toFixed(1)}%` : 'n/a');
    console.log(`ok   ${rel.padEnd(20)} ${size}B → gz ${gzSize}B (${pct(gzSize)}), br ${brSize}B (${pct(brSize)})`);
    ok += 1;
  }
  console.log(`\nCompressed ${ok} file(s), skipped ${skipped}.`);
}

main().catch((err) => {
  console.error('compress-assets failed:', err);
  process.exit(1);
});
