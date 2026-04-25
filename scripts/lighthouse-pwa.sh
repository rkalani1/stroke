#!/usr/bin/env bash
# Lighthouse PWA audit for the Stroke app.
#
# This is a one-shot helper: it audits the LIVE deployed app at GitHub Pages
# rather than a local server, so it tests exactly what users see (HTTPS, real
# CDN paths, real cache headers, real installability).
#
# Targets:
#   PWA              >= 90
#   Performance      >= 80   (clinical app on cellular — be realistic)
#   Accessibility    >= 90
#   Best Practices   >= 90
#
# Requirements:
#   - Node 18+ (for npx)
#   - Google Chrome installed (Lighthouse uses headless Chrome)
#   - Internet access to https://rkalani1.github.io/stroke/
#
# Output:
#   ./output/lighthouse-pwa.html   (human-readable report)
#   ./output/lighthouse-pwa.json   (machine-readable scores)
#
# Usage:
#   ./scripts/lighthouse-pwa.sh
#   ./scripts/lighthouse-pwa.sh https://localhost:8080/stroke/   # alternative URL

set -euo pipefail

URL="${1:-https://rkalani1.github.io/stroke/}"
OUT_DIR="${2:-./output}"
mkdir -p "$OUT_DIR"

echo "Running Lighthouse against $URL..."
echo "Reports will be written to $OUT_DIR/lighthouse-pwa.{html,json}"

npx --yes lighthouse "$URL" \
  --only-categories=pwa,performance,accessibility,best-practices \
  --chrome-flags="--headless=new --no-sandbox" \
  --output=html --output=json \
  --output-path="$OUT_DIR/lighthouse-pwa"

echo ""
echo "Done. Open $OUT_DIR/lighthouse-pwa.report.html in a browser."

# Print the key category scores in plain text for quick triage.
node -e "
const fs = require('fs');
const path = '$OUT_DIR/lighthouse-pwa.report.json';
if (!fs.existsSync(path)) { console.log('JSON report missing — see lighthouse output above'); process.exit(0); }
const r = JSON.parse(fs.readFileSync(path, 'utf8'));
const cats = r.categories || {};
const fmt = (k) => cats[k] ? Math.round(cats[k].score * 100) : 'n/a';
console.log('--- Lighthouse summary ---');
['pwa','performance','accessibility','best-practices'].forEach(k => console.log(\`  \${k.padEnd(15)} \${fmt(k)}\`));
"
