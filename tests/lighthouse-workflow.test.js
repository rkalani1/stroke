import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const workflow = readFileSync(join(repoRoot, '.github/workflows/lighthouse.yml'), 'utf8');
const ciWorkflow = readFileSync(join(repoRoot, '.github/workflows/ci.yml'), 'utf8');
const liveSmokeWorkflow = readFileSync(join(repoRoot, '.github/workflows/live-smoke.yml'), 'utf8');
const qaSmokeScript = readFileSync(join(repoRoot, 'scripts/qa-smoke.mjs'), 'utf8');
const apiIndex = JSON.parse(readFileSync(join(repoRoot, 'data/index.json'), 'utf8'));
const guidelineIndex = JSON.parse(readFileSync(join(repoRoot, 'data/guidelines/index.json'), 'utf8'));
const quoted = (value) => new RegExp(`["']${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`);

function countOccurrences(text, pattern) {
  return (text.match(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
}

describe('Lighthouse workflow deployment guard', () => {
  it('runs on public data changes and verifies deployed artifacts', () => {
    for (const path of [
      "- 'index.html'",
      "- 'manifest.json'",
      "- 'service-worker.js'",
      "- 'app.js'",
      "- 'tailwind.css'",
      "- 'offline.html'",
      "- 'data/**'",
      "- 'llms.txt'",
      "- 'llms-full.txt'",
      "- 'whats-new.json'",
      "- 'robots.txt'",
      "- 'sitemap.xml'",
      "- 'src/**'"
    ]) {
      expect(workflow).toContain(path);
    }

    for (const artifact of [
      'index.html',
      'tailwind.css',
      'offline.html',
      'app.js',
      'data/index.json',
      'whats-new.json',
      'llms.txt',
      'llms-full.txt',
      'manifest.json',
      'service-worker.js',
      'robots.txt',
      'sitemap.xml'
    ]) {
      expect(workflow).toMatch(quoted(artifact));
    }
    expect(workflow).toContain("JSON.parse(fs.readFileSync('data/index.json', 'utf8'))");
    expect(workflow).toContain("JSON.parse(fs.readFileSync('data/guidelines/index.json', 'utf8'))");
    expect(workflow).toContain('for (const endpoint of apiIndex.endpoints || []) add(toRel(endpoint));');
    expect(workflow).toContain('for (const guideline of guidelineIndex.data || []) add(toRel(guideline.url));');

    for (const endpoint of apiIndex.endpoints) {
      const rel = endpoint.replace('https://rkalani1.github.io/stroke/', '');
      expect(workflow).toContain('apiIndex.endpoints');
      expect(readFileSync(join(repoRoot, rel), 'utf8'), `${rel} should exist locally`).toBeTruthy();
    }
    for (const guideline of guidelineIndex.data) {
      const rel = guideline.url.replace('https://rkalani1.github.io/stroke/', '');
      expect(workflow).toContain('guideline.url');
      expect(readFileSync(join(repoRoot, rel), 'utf8'), `${rel} should exist locally`).toBeTruthy();
    }

    expect(workflow).toMatch(/EXPECTED="\$\(sha256sum app\.js \| awk '\{print \$1\}'\)"/);
    expect(workflow).toMatch(/https:\/\/rkalani1\.github\.io\/stroke\/app\.js\?sha=\$\{GITHUB_SHA\}&try=\$\{i\}/);
    expect(workflow).toMatch(/ACTUAL="\$\(sha256sum live-app\.js \| awk '\{print \$1\}'\)"/);
    expect(workflow).toMatch(/if \[ "\$ACTUAL" = "\$EXPECTED" \]; then[\s\S]{0,180}Live Pages app\.js matches checked-out commit/);
    expect(workflow).toMatch(/Timed out waiting for live Pages app\.js to match this commit\.[\s\S]{0,80}exit 1/);
    expect(workflow).toMatch(/Timed out waiting for live Pages artifact to match this commit:[\s\S]{0,120}\$\{artifact\}/);
    expect(workflow).toMatch(/if \[ "\$ok" != "1" \]; then[\s\S]{0,160}exit 1/);
    expect(workflow).toMatch(/if \[ ! -f lighthouse\.report\.json \]; then[\s\S]{0,160}exit 1/);
    expect(workflow).toContain('if-no-files-found: error');
    expect(workflow).toContain('contents: read');
    expect(workflow).toContain('persist-credentials: false');
    expect(workflow).toContain('cat comment.md >> "$GITHUB_STEP_SUMMARY"');
    expect(workflow).toContain('echo "| Performance | $PERF | advisory |"');
    expect(workflow).not.toMatch(/Lighthouse Performance score \$PERF is below required threshold/);
    expect(workflow).toMatch(/Lighthouse Accessibility score \$A11Y is below required threshold 90/);
    expect(workflow).toMatch(/Lighthouse Best Practices score \$BP is below required threshold 90/);
    expect(workflow).toMatch(/if \[ "\$FAILED" -ne 0 \]; then[\s\S]{0,80}exit 1/);
    expect(workflow).not.toMatch(/never fails the (?:build|workflow) on score regressions/i);
    expect(workflow).not.toContain('pull-requests: write');
    expect(workflow).not.toContain('actions/github-script');
    expect(workflow).not.toContain('Comment on PR');
  });
});

describe('CI leak-guard workflow enforcement', () => {
  it('requires the private denylist secret before CI and live-smoke leak scans', () => {
    expect(countOccurrences(ciWorkflow, 'STROKE_LEAK_GUARD_PRIVATE_DENYLIST_JSON secret is required for CI leak scanning.')).toBe(3);
    expect(countOccurrences(ciWorkflow, "printf '%s' \"$PRIVATE_DENYLIST_JSON\" > scripts/leak-guard-denylist.local.json")).toBe(3);
    expect(countOccurrences(ciWorkflow, 'STROKE_LEAK_GUARD_REQUIRE_PRIVATE=1 npm run check:leak-guard')).toBe(3);
    expect(ciWorkflow).toContain('PRIVATE_DENYLIST_JSON: ${{ secrets.STROKE_LEAK_GUARD_PRIVATE_DENYLIST_JSON }}');

    expect(liveSmokeWorkflow).toContain('PRIVATE_DENYLIST_JSON: ${{ secrets.STROKE_LEAK_GUARD_PRIVATE_DENYLIST_JSON }}');
    expect(liveSmokeWorkflow).toContain('STROKE_LEAK_GUARD_PRIVATE_DENYLIST_JSON secret is required for live-smoke leak scanning.');
    expect(liveSmokeWorkflow).toContain("printf '%s' \"$PRIVATE_DENYLIST_JSON\" > scripts/leak-guard-denylist.local.json");
    expect(liveSmokeWorkflow).toContain('STROKE_LEAK_GUARD_REQUIRE_PRIVATE=1 npm run check:leak-guard');
  });

  it('keeps live-smoke structural QA hard-gated while latency thresholds are advisory', () => {
    expect(liveSmokeWorkflow).toContain('Run hard structural QA validators');
    expect(liveSmokeWorkflow).toContain('npm run validate:citations');
    expect(liveSmokeWorkflow).toContain('npm run validate:inline-citations');
    expect(liveSmokeWorkflow).toContain('npm run evidence:validate');
    expect(liveSmokeWorkflow).toContain('npm run validate:whats-new');
    expect(liveSmokeWorkflow).toContain('npm run validate:automedbench-lite');
    expect(liveSmokeWorkflow).toContain('Run adaptive QA smoke (local + live)');
    expect(liveSmokeWorkflow).toContain('Verify live Pages artifact parity');
    expect(liveSmokeWorkflow).toMatch(/Timed out waiting for live Pages artifact to match this commit:[\s\S]{0,160}exit 1/);
    expect(liveSmokeWorkflow).toMatch(/Live Pages public artifacts match checked-out commit\./);
    expect(liveSmokeWorkflow).toContain('output/diagnostics/qa-smoke-adaptive.log');
    expect(liveSmokeWorkflow).toContain('Run adaptive latency threshold advisory (local + live)');
    expect(liveSmokeWorkflow).toMatch(/Run adaptive latency threshold advisory \(local \+ live\)[\s\S]{0,120}continue-on-error: true/);
    expect(liveSmokeWorkflow).toContain('--enforce-latency-thresholds');
    expect(countOccurrences(liveSmokeWorkflow, 'continue-on-error: true')).toBe(1);
    expect(liveSmokeWorkflow).not.toMatch(/continue-on-error: true[\s\S]{0,120}npm run qa:latency-adaptive-strict/);
    expect(liveSmokeWorkflow).toContain('output/diagnostics/qa-latency-threshold-advisory.log');
    expect(liveSmokeWorkflow).not.toContain('qa:latency-adaptive-strict');
    expect(qaSmokeScript).toContain("type: 'live-deployment-parity'");
    expect(qaSmokeScript).toContain('Live app version does not match the checked-out local build.');
  });
});
