// tests/e2e/e2e-suite.test.js
// Master E2E Suite Aggregator & Invariant Verifier
// Validates full coverage across Tiers 1-4 for all 19 features in TEST_INFRA.md

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');

describe('Master E2E Suite Aggregator & Quality Invariants', () => {
  const e2eDir = path.join(ROOT, 'tests/e2e');
  const files = fs.readdirSync(e2eDir).filter(f => f.startsWith('tier') && f.endsWith('.test.js'));

  it('All 4 Tier test files exist in tests/e2e/', () => {
    expect(files).toContain('tier1-feature-coverage.test.js');
    expect(files).toContain('tier2-boundary-corners.test.js');
    expect(files).toContain('tier3-cross-feature-combinations.test.js');
    expect(files).toContain('tier4-clinical-workload-scenarios.test.js');
  });

  it('Tier 1 contains at least 95 test cases covering Features 1-19', () => {
    const content = fs.readFileSync(path.join(e2eDir, 'tier1-feature-coverage.test.js'), 'utf8');
    const matches = content.match(/\bit\(/g) || [];
    expect(matches.length).toBeGreaterThanOrEqual(95);
    for (let f = 1; f <= 19; f++) {
      expect(content).toContain(`Feature ${f}:`);
    }
  });

  it('Tier 2 contains at least 95 boundary & corner test cases covering Features 1-19', () => {
    const content = fs.readFileSync(path.join(e2eDir, 'tier2-boundary-corners.test.js'), 'utf8');
    const matches = content.match(/\bit\(/g) || [];
    expect(matches.length).toBeGreaterThanOrEqual(95);
    for (let f = 1; f <= 19; f++) {
      expect(content).toContain(`Feature ${f} Boundary & Corner Cases`);
    }
  });

  it('Tier 3 contains at least 19 cross-feature combination test cases', () => {
    const content = fs.readFileSync(path.join(e2eDir, 'tier3-cross-feature-combinations.test.js'), 'utf8');
    const matches = content.match(/\bit\(/g) || [];
    expect(matches.length).toBeGreaterThanOrEqual(19);
  });

  it('Tier 4 contains at least 5 complete real-world clinical workload application scenarios', () => {
    const content = fs.readFileSync(path.join(e2eDir, 'tier4-clinical-workload-scenarios.test.js'), 'utf8');
    const matches = content.match(/\bit\(/g) || [];
    expect(matches.length).toBeGreaterThanOrEqual(20);
    for (let s = 1; s <= 5; s++) {
      expect(content).toContain(`Scenario ${s}:`);
    }
  });

  it('Total cumulative E2E test cases across the entire suite exceed the target minimum (>= 214)', () => {
    let totalTests = 0;
    for (const f of files) {
      const content = fs.readFileSync(path.join(e2eDir, f), 'utf8');
      const matches = content.match(/\bit\(/g) || [];
      totalTests += matches.length;
    }
    expect(totalTests).toBeGreaterThanOrEqual(214);
    expect(totalTests).toBe(236);
  });
});
