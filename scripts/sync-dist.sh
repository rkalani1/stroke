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

cp index.html app.js tailwind.css manifest.json service-worker.js offline.html "$DIST/" 2>/dev/null || true
cp icon-192.png icon-512.png "$DIST/" 2>/dev/null || true
cp screenshot1.png "$DIST/" 2>/dev/null || true

if [ -d assets/splash ]; then
  cp assets/splash/*.png "$DIST/assets/splash/" 2>/dev/null || true
fi

echo "Synced $(find "$DIST" -type f | wc -l | tr -d ' ') files into $DIST/"
