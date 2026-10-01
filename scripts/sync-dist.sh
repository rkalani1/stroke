#!/usr/bin/env bash
# Syncs the deployable web assets into ./dist/ for Capacitor consumption.
# The repo deploys to GitHub Pages directly from the root, so dist/ is
# only used by Capacitor (`npx cap copy ios|android`) — never deployed.
#
# Run: bash scripts/sync-dist.sh

set -euo pipefail

DIST=dist
mkdir -p "$DIST"
mkdir -p "$DIST/assets/splash"

node --input-type=module <<'JS'
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
const manifest = JSON.parse(await fs.readFile('app-assets.json', 'utf8'));
if (manifest.buildTarget !== 'public') throw Error('Refusing to package a non-public browser build');
const checked = [];
for (const file of manifest.files) {
  if (!/^(app\.js|chunks\/[A-Za-z0-9_-]+\.js)$/.test(file.path)) throw Error(`Invalid browser module path: ${file.path}`);
  const bytes = await fs.readFile(file.path);
  if (createHash('sha256').update(bytes).digest('hex') !== file.sha256) throw Error(`Stale browser module: ${file.path}`);
  checked.push({ ...file, bytes });
}
// Validate the entire module set before copying it into the native shell.
await fs.rm('dist/chunks', { recursive: true, force: true });
for (const file of checked) {
  const dest = path.join('dist', file.path);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, file.bytes);
}
await fs.copyFile('app-assets.json', 'dist/app-assets.json');
JS
cp index.html tailwind.css manifest.json service-worker.js offline.html "$DIST/"
cp icon-192.png icon-512.png "$DIST/" 2>/dev/null || true
cp screenshot1.png "$DIST/" 2>/dev/null || true

if [ -d assets/splash ]; then
  cp assets/splash/*.png "$DIST/assets/splash/" 2>/dev/null || true
fi

echo "Synced $(find "$DIST" -type f | wc -l | tr -d ' ') files into $DIST/"
