// tests/adversarial-m3-challenger.test.js
//
// Comprehensive Empirical Challenger Test Suite for Milestone 3
// Tests:
// 1. Institutional leak guard detection accuracy, false negative resistance, and exemption boundaries
// 2. Protocol snapshot lock robustness across all 6 subtabs, drift detection, tampering rejection
// 3. Static & inline citation validator coverage, PMID format validation, registry consistency
// 4. Content bundling and schema validator integrity

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { citations } from '../src/evidence/citations.js';
import { VALIDATORS, parseFrontmatter, PMID_PATTERN } from '../content/schema.mjs';

const REPO_ROOT = path.resolve(__dirname, '..');
const LEAK_GUARD_SCRIPT = path.join(REPO_ROOT, 'scripts', 'check-no-institutional-leak.mjs');
const CITATION_SCRIPT = path.join(REPO_ROOT, 'scripts', 'validate-citations.mjs');
const INLINE_CITATION_SCRIPT = path.join(REPO_ROOT, 'scripts', 'validate-inline-citations.mjs');
const BUNDLE_SCRIPT = path.join(REPO_ROOT, 'scripts', 'build-content-bundle.mjs');
const VALIDATE_CONTENT_SCRIPT = path.join(REPO_ROOT, 'scripts', 'validate-content.mjs');

describe('Empirical Adversarial Verification: Milestone 3', () => {

  describe('1. Institutional Leak Guard Adversarial Stress Testing', () => {
    
    function runLeakGuardOnContent(fileContentsMap, extraArgs = []) {
      const tempDir = path.join(REPO_ROOT, 'tests', '_temp_leak_test_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));
      fs.mkdirSync(tempDir, { recursive: true });
      const fileList = [];
      try {
        for (const [relPath, content] of Object.entries(fileContentsMap)) {
          const absPath = path.join(tempDir, relPath);
          fs.mkdirSync(path.dirname(absPath), { recursive: true });
          fs.writeFileSync(absPath, content, 'utf8');
          fileList.push(path.relative(REPO_ROOT, absPath));
        }

        const input = fileList.join('\n');
        const res = spawnSync('node', [LEAK_GUARD_SCRIPT, '--json', ...extraArgs], {
          cwd: REPO_ROOT,
          input,
          encoding: 'utf8',
        });
        
        let jsonOutput = null;
        try {
          jsonOutput = JSON.parse(res.stdout);
        } catch {
          // fallback
        }
        return {
          status: res.status,
          stdout: res.stdout,
          stderr: res.stderr,
          json: jsonOutput,
        };
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }

    it('detects standard and varied phone number patterns', () => {
      const cases = [
        ['Call ', '555', '-', '123', '-', '4567', ' for details'].join(''),
        ['Direct: ', '800', '.', '555', '.', '0199'].join(''),
        ['Contact ', '206', ' ', '555', ' ', '0142', ' now'].join(''),
        ['Emergency ', '123', '-', '456', '-', '7890', ' line'].join(''),
      ];
      for (const line of cases) {
        const result = runLeakGuardOnContent({ 'sample.txt': line });
        expect(result.status, `Failed to detect phone pattern in: "${line}"`).toBe(1);
        expect(result.json.violations.length).toBeGreaterThan(0);
        expect(result.json.violations[0].tier).toBe('phi');
      }
    });

    it('detects pager number patterns with varied formats and case variations', () => {
      const cases = [
        ['pa', 'ger: 12345'].join(''),
        ['pa', 'ger #54321'].join(''),
        ['pa', 'ger:123'].join(''),
        ['Pa', 'ger 9999'].join(''),
        ['PA', 'GER: 4567'].join(''),
        ['PA', 'GER #1010'].join(''),
      ];
      for (const line of cases) {
        const result = runLeakGuardOnContent({ 'sample.txt': line });
        expect(result.status, `Failed to detect pager pattern in: "${line}"`).toBe(1);
        expect(result.json.violations.length).toBeGreaterThan(0);
        expect(result.json.violations[0].tier).toBe('phi');
      }
    });

    it('detects keypad/door access code patterns', () => {
      const cases = [
        ['key', 'pad 1234'].join(''),
        ['key', 'pad: 5678'].join(''),
        ['key', 'pad code 9999'].join(''),
        ['KEY', 'PAD #1234'].join(''),
        ['key', 'pad is 4321'].join(''),
      ];
      for (const line of cases) {
        const result = runLeakGuardOnContent({ 'sample.txt': line });
        expect(result.status, `Failed to detect keypad pattern in: "${line}"`).toBe(1);
        expect(result.json.violations.length).toBeGreaterThan(0);
        expect(result.json.violations[0].tier).toBe('phi');
      }
    });

    it('detects synthetic institutional and identity sentinels', () => {
      const instResult = runLeakGuardOnContent({ 'src/test-file.js': ['const inst = "', 'PUBLIC_PRIVATE', '_INSTITUTION_SENTINEL";'].join('') });
      expect(instResult.status).toBe(1);
      expect(instResult.json.violations.some(v => v.tier === 'institutional')).toBe(true);

      const identResult = runLeakGuardOnContent({ 'src/test-file.js': ['const author = "', 'PUBLIC_PRIVATE', '_IDENTITY_SENTINEL";'].join('') });
      expect(identResult.status).toBe(1);
      expect(identResult.json.violations.some(v => v.tier === 'identity')).toBe(true);

      const litResult = runLeakGuardOnContent({ 'src/test-file.js': ['const lit = "', 'PUBLIC_PRIVATE', '_LITERAL_SENTINEL";'].join('') });
      expect(litResult.status).toBe(1);
      expect(litResult.json.violations.some(v => v.tier === 'phi')).toBe(true);
    });

    it('correctly handles exempt files: allows institutional tokens in COMPLIANCE.md but bans PHI', () => {
      // Test with actual COMPLIANCE.md path
      const resPass = spawnSync('node', [LEAK_GUARD_SCRIPT, '--json'], {
        cwd: REPO_ROOT,
        input: 'COMPLIANCE.md\n',
        encoding: 'utf8',
      });
      expect(resPass.status).toBe(0);
      const jsonPass = JSON.parse(resPass.stdout);
      expect(jsonPass.violations.length).toBe(0);

      // Verify that fullyExemptFiles (leak-guard-denylist.json) is skipped completely
      const resExempt = spawnSync('node', [LEAK_GUARD_SCRIPT, '--json'], {
        cwd: REPO_ROOT,
        input: 'scripts/leak-guard-denylist.json\n',
        encoding: 'utf8',
      });
      expect(resExempt.status).toBe(0);
      const jsonExempt = JSON.parse(resExempt.stdout);
      expect(jsonExempt.scanned).toBe(0);
    });

    it('verifies SHA256 hashed denylist matching with text and digit normalizations', () => {
      const textToBan = 'Top Secret Hospital Clinic';
      const textHash = crypto.createHash('sha256').update(textToBan.toLowerCase().trim()).digest('hex');
      const phoneDigits = '2065559999';
      const digitsHash = crypto.createHash('sha256').update(phoneDigits).digest('hex');

      const customDenylist = {
        literalSha256Denylist: [
          { sha256: textHash, label: 'Banned Clinic', tier: 'phi', normalization: 'text' },
          { sha256: digitsHash, label: 'Banned Phone', tier: 'phi', normalization: 'digits' },
        ]
      };

      const customDenylistPath = path.join(REPO_ROOT, 'scripts', 'leak-guard-denylist.local.json');
      // This path is a REAL developer file: a populated private denylist is what makes the
      // pre-commit leak guard functional. Preserve any existing content and restore it in
      // finally — deleting it outright silently disarms the guard until the dev notices.
      const priorDenylist = fs.existsSync(customDenylistPath)
        ? fs.readFileSync(customDenylistPath, 'utf8')
        : null;
      fs.writeFileSync(customDenylistPath, JSON.stringify(customDenylist), 'utf8');
      try {
        const textHit = runLeakGuardOnContent({ 'test.js': 'Welcome to "Top   Secret   Hospital   Clinic" today' });
        expect(textHit.status, 'SHA256 text normalization failed to catch normalized phrase').toBe(1);
        expect(textHit.json.violations.some(v => v.label.includes('Banned Clinic'))).toBe(true);

        const digitHit = runLeakGuardOnContent({ 'test.js': ['Call: ', '206', '-', '555', '-', '9999', ' now'].join('') });
        expect(digitHit.status, 'SHA256 digits normalization failed to catch formatted phone digits').toBe(1);
        expect(digitHit.json.violations.some(v => v.label.includes('Banned Phone'))).toBe(true);
      } finally {
        if (priorDenylist === null) fs.rmSync(customDenylistPath, { force: true });
        else fs.writeFileSync(customDenylistPath, priorDenylist, 'utf8');
      }
    });

    it('enforces --require-private failure when no private rules loaded', () => {
      // The guard resolves its private denylist from a script-relative path, so this
      // assertion only holds when no developer denylist is present. Move any real one
      // aside for the duration rather than asserting against developer machine state.
      const realDenylist = path.join(REPO_ROOT, 'scripts', 'leak-guard-denylist.local.json');
      const stashed = fs.existsSync(realDenylist) ? fs.readFileSync(realDenylist, 'utf8') : null;
      if (stashed !== null) fs.rmSync(realDenylist, { force: true });
      try {
        const res = spawnSync('node', [LEAK_GUARD_SCRIPT, '--json', '--require-private'], {
          cwd: REPO_ROOT,
          input: '',
          encoding: 'utf8',
        });
        expect(res.status).toBe(1);
        const json = JSON.parse(res.stdout);
        expect(json.error).toContain('private denylist required');
      } finally {
        if (stashed !== null) fs.writeFileSync(realDenylist, stashed, 'utf8');
      }
    });
  });

  describe('2. Protocol Snapshot Lock Robustness & Drift Detection', () => {
    const SUBTABS = ['ich', 'ischemic', 'sah', 'tia', 'cvt', 'calculators'];
    const SNAPSHOT_DIR = path.join(REPO_ROOT, 'tests', 'snapshots', 'example-protocols');

    it('verifies all 6 protocol baseline snapshots exist with substantial content', () => {
      for (const subtab of SUBTABS) {
        const file = path.join(SNAPSHOT_DIR, `${subtab}.txt`);
        expect(fs.existsSync(file), `Snapshot file for ${subtab} must exist`).toBe(true);
        const content = fs.readFileSync(file, 'utf8');
        const lineCount = content.split('\n').filter(Boolean).length;
        expect(lineCount, `${subtab} must have > 20 lines`).toBeGreaterThan(20);
      }
    });

    it('verifies expected exact line count bounds for all 6 snapshots', () => {
      // 2026-08-16: ich 578->579, ischemic 1448->1450 from the reviewed clinical
      // correction to the orolingual-angioedema step (holding ACE inhibitors now leads,
      // and stopping the infusion is conditional on alteplase). See the git diff of
      // tests/snapshots/example-protocols/ for the approved wording.
      const baselineCounts = {
        ich: 579,
        ischemic: 1450,
        sah: 233,
        tia: 200,
        cvt: 120,
        calculators: 793
      };
      for (const [subtab, expectedLines] of Object.entries(baselineCounts)) {
        const file = path.join(SNAPSHOT_DIR, `${subtab}.txt`);
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n').length - 1;
        expect(lines, `${subtab} snapshot lines count mismatch`).toBe(expectedLines);
      }
    });

    it('verifies divergence detection logic accurately pinpoints line mismatches', () => {
      function firstDivergence(expected, actual) {
        const a = expected.split('\n');
        const b = actual.split('\n');
        const max = Math.max(a.length, b.length);
        for (let i = 0; i < max; i += 1) {
          if (a[i] !== b[i]) {
            return { line: i + 1, expected: a[i] ?? '<missing>', actual: b[i] ?? '<missing>' };
          }
        }
        return null;
      }

      const original = "Line 1\nLine 2\nLine 3\n";
      const tampered = "Line 1\nLine 2 Modified\nLine 3\n";
      const div = firstDivergence(original, tampered);
      expect(div).not.toBeNull();
      expect(div.line).toBe(2);
      expect(div.expected).toBe("Line 2");
      expect(div.actual).toBe("Line 2 Modified");

      const truncated = "Line 1\nLine 2\n";
      const divTrunc = firstDivergence(original, truncated);
      expect(divTrunc).not.toBeNull();
      expect(divTrunc.line).toBe(3);
    });
  });

  describe('3. Static & Inline Citation Validator Coverage & Integrity', () => {
    
    it('verifies all 86+ citations in src/evidence/citations.js have valid PMIDs and matching URLs', () => {
      expect(citations.length).toBeGreaterThanOrEqual(86);
      for (const c of citations) {
        if (c.pmid) {
          expect(String(c.pmid)).toMatch(PMID_PATTERN);
          if (c.url && c.url.includes('pubmed.ncbi.nlm.nih.gov')) {
            const match = c.url.match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/i);
            expect(match, `URL ${c.url} in citation ${c.id} must contain numeric PMID`).not.toBeNull();
            expect(match[1], `URL PMID must match citation pmid in ${c.id}`).toBe(String(c.pmid));
          }
        }
      }
    });

    it('verifies no duplicate PMIDs with conflicting titles exist in citations.js', () => {
      const seen = new Map();
      for (const c of citations) {
        if (!c.pmid) continue;
        const pmid = String(c.pmid);
        if (seen.has(pmid)) {
          expect(seen.get(pmid), `PMID ${pmid} in ${c.id} conflicts with earlier citation`).toBe(c.title);
        } else {
          seen.set(pmid, c.title);
        }
      }
    });

    it('verifies educational markdown files exist and satisfy education schema requirements', () => {
      const eduDir = path.join(REPO_ROOT, 'content', 'education');
      const files = fs.readdirSync(eduDir).filter(f => f.endsWith('.md'));
      expect(files.length).toBeGreaterThanOrEqual(32);

      const ctx = {
        citationIds: new Set(citations.map((c) => c.id)),
        pmids: new Set(citations.map((c) => c.pmid).filter(Boolean)),
        dois: new Set(citations.map((c) => c.doi).filter(Boolean)),
        calculatorIds: new Set(
          JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'content', 'calculators', 'registry.json'), 'utf8')).map((c) => c.id)
        ),
        now: new Date(),
        maxAgeMonths: 18,
        staleIsError: false,
      };

      for (const file of files) {
        const fullPath = path.join(eduDir, file);
        const text = fs.readFileSync(fullPath, 'utf8');
        const { data, body } = parseFrontmatter(text);
        const { errors } = VALIDATORS.education(data, ctx);
        expect(errors, `${file} failed schema validation: ${errors.join(', ')}`).toEqual([]);
        expect(body.length, `${file} content body must not be empty`).toBeGreaterThan(10);
      }
    });

    it('verifies validate-inline-citations passes strict mode with zero review warnings', () => {
      const res = spawnSync('node', [INLINE_CITATION_SCRIPT, '--strict'], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
      });
      expect(res.status, `Inline citation validator failed: ${res.stdout} ${res.stderr}`).toBe(0);
      expect(res.stdout).toContain('Inline citation validation passed');
      expect(res.stdout).toContain('0 review warnings');
    });

    it('verifies validate-citations passes on evidence review table', () => {
      const res = spawnSync('node', [CITATION_SCRIPT], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
      });
      expect(res.status, `Static citation validator failed: ${res.stdout} ${res.stderr}`).toBe(0);
      expect(res.stdout).toContain('Citation validation passed');
    });
  });

  describe('4. Content Bundle & Validation Pipeline Determinism', () => {
    
    it('verifies build-content-bundle --check runs cleanly and detects records across 5 domains', () => {
      const res = spawnSync('node', [BUNDLE_SCRIPT, '--check'], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
      });
      expect(res.status).toBe(0);
      expect(res.stdout).toContain('bundle is up to date');

      const bundlePath = path.join(REPO_ROOT, 'content', 'bundle.json');
      const bundle = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));
      expect(bundle.guidelines?.length).toBe(11);
      expect(bundle.trials?.length).toBe(113);
      expect(bundle.education?.length).toBeGreaterThanOrEqual(32);
      expect(bundle.calculators?.length).toBe(34);
      expect(bundle.references?.length).toBe(18);

      const total = bundle.guidelines.length + bundle.trials.length + bundle.education.length + bundle.calculators.length + bundle.references.length;
      expect(total).toBeGreaterThanOrEqual(166);
    });

    it('verifies validate-content --json reports 0 fatal errors across all records', () => {
      const res = spawnSync('node', [VALIDATE_CONTENT_SCRIPT, '--json'], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
      });
      expect(res.status).toBe(0);
      const json = JSON.parse(res.stdout);
      expect(json.errors.length).toBe(0);
      expect(json.counts.guidelines).toBe(11);
      expect(json.counts.trials).toBe(113);
      expect(json.counts.education).toBeGreaterThanOrEqual(32);
      expect(json.counts.calculators).toBe(34);
      expect(json.counts.references).toBe(18);
    });
  });
});
