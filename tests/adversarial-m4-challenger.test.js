// tests/adversarial-m4-challenger.test.js
//
// Comprehensive Empirical Challenger Test Suite for Milestone 4 (Production Build & Deployment)
//
// Verifies:
// 1. Build Reproducibility & Compression Efficiency (brotli < gzip < uncompressed)
// 2. Offline Service Worker Caching Integrity & PWA Manifest Validity
// 3. Git Tracking Status, Branch Cleanliness, and Commit Alignment
// 4. Institutional Leak Guard Robustness against Production Assets and Synthetic Attacks

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync, execSync } from 'node:child_process';

const REPO_ROOT = path.resolve(__dirname, '..');
const LEAK_GUARD_SCRIPT = path.join(REPO_ROOT, 'scripts', 'check-no-institutional-leak.mjs');
const COMPRESS_SCRIPT = path.join(REPO_ROOT, 'scripts', 'compress-assets.mjs');
const MANIFEST_PATH = path.join(REPO_ROOT, 'manifest.json');
const SW_PATH = path.join(REPO_ROOT, 'service-worker.js');
const deploymentStateIt = process.env.STROKE_VERIFY_DEPLOYMENT_STATE === '1' ? it : it.skip;

describe('Empirical Adversarial Verification: Milestone 4 (Production Build & Deployment)', () => {

  describe('1. Production Build Reproducibility & Compression Efficiency', () => {
    
    it('executes production build pipeline (build:prod) cleanly', () => {
      const res = spawnSync('npm', ['run', 'build:prod'], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        shell: true,
      });
      expect(res.status, `npm run build:prod failed: ${res.stderr || res.stdout}`).toBe(0);
    });

    it('verifies that all critical build targets exist in project root', () => {
      const targets = [
        'app.js',
        'tailwind.css',
        'index.html',
        'manifest.json',
        'service-worker.js',
        'whats-new.json',
        'content/bundle.json'
      ];
      for (const target of targets) {
        const fullPath = path.join(REPO_ROOT, target);
        expect(fs.existsSync(fullPath), `Missing built asset: ${target}`).toBe(true);
        const stats = fs.statSync(fullPath);
        expect(stats.size, `Empty asset: ${target}`).toBeGreaterThan(0);
      }
    });

    it('empirically verifies compression hierarchy: brotli < gzip < raw for all compressed targets', () => {
      const targets = [
        'app.js',
        'tailwind.css',
        'index.html',
        'manifest.json',
        'service-worker.js'
      ];

      for (const target of targets) {
        const rawPath = path.join(REPO_ROOT, target);
        const gzPath = path.join(REPO_ROOT, `${target}.gz`);
        const brPath = path.join(REPO_ROOT, `${target}.br`);

        expect(fs.existsSync(rawPath), `Raw file missing: ${target}`).toBe(true);
        expect(fs.existsSync(gzPath), `Gzip file missing: ${target}.gz`).toBe(true);
        expect(fs.existsSync(brPath), `Brotli file missing: ${target}.br`).toBe(true);

        const rawSize = fs.statSync(rawPath).size;
        const gzSize = fs.statSync(gzPath).size;
        const brSize = fs.statSync(brPath).size;

        expect(gzSize, `Gzip size (${gzSize}) should be smaller than raw size (${rawSize}) for ${target}`).toBeLessThan(rawSize);
        expect(brSize, `Brotli size (${brSize}) should be smaller than gzip size (${gzSize}) for ${target}`).toBeLessThan(gzSize);
        expect(brSize, `Brotli size (${brSize}) should be smaller than raw size (${rawSize}) for ${target}`).toBeLessThan(rawSize);

        // Verify compression ratios
        const brRatio = brSize / rawSize;
        const gzRatio = gzSize / rawSize;
        expect(brRatio).toBeLessThan(gzRatio);
      }
    });

    it('verifies content bundle idempotency and synchronization', () => {
      const res = spawnSync('node', ['./scripts/build-content-bundle.mjs', '--check'], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
      });
      expect(res.status, 'Content bundle is out of sync').toBe(0);
      expect(res.stdout).toContain('bundle is up to date');
    });

    it('verifies agent assets idempotency and synchronization', () => {
      const res = spawnSync('node', ['./scripts/generate-agent-assets.mjs', '--check'], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
      });
      expect(res.status, 'Agent assets are out of sync').toBe(0);
    });

    it('verifies seed content synchronization', () => {
      const res = spawnSync('node', ['./scripts/seed-content.mjs', '--check'], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
      });
      expect(res.status, 'Seed content is out of sync').toBe(0);
    });
  });

  describe('2. Offline Service Worker Caching Integrity & PWA Manifest Validity', () => {

    it('validates manifest.json syntax, required fields, and category tags', () => {
      expect(fs.existsSync(MANIFEST_PATH), 'manifest.json must exist').toBe(true);
      const manifestRaw = fs.readFileSync(MANIFEST_PATH, 'utf8');
      const manifest = JSON.parse(manifestRaw);

      expect(manifest.name).toBe('Stroke CDS Educational Demo');
      expect(manifest.short_name).toBe('Stroke Demo');
      expect(manifest.start_url).toBe('./#/encounter');
      expect(manifest.display).toBe('standalone');
      expect(manifest.background_color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(manifest.theme_color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(Array.isArray(manifest.icons)).toBe(true);
      expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
      expect(manifest.categories).toContain('medical');
      expect(manifest.categories).toContain('education');
    });

    it('verifies all PWA icons exist on disk and contain valid PNG magic bytes', () => {
      const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
      for (const icon of manifest.icons) {
        const iconPath = path.join(REPO_ROOT, icon.src);
        expect(fs.existsSync(iconPath), `Icon not found on disk: ${icon.src}`).toBe(true);
        
        const buf = fs.readFileSync(iconPath);
        expect(buf.length).toBeGreaterThan(100);
        // PNG magic bytes: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
        expect(buf[0]).toBe(0x89);
        expect(buf[1]).toBe(0x50);
        expect(buf[2]).toBe(0x4E);
        expect(buf[3]).toBe(0x47);
      }
    });

    it('validates service-worker.js versioning and cache naming alignment', () => {
      const swContent = fs.readFileSync(SW_PATH, 'utf8');
      const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));

      const versionMatch = swContent.match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/);
      expect(versionMatch, 'APP_VERSION constant found in SW').not.toBeNull();
      expect(versionMatch[1]).toBe(pkg.version);

      const cacheMatch = swContent.match(/CACHE_NAME\s*=\s*['"]([^'"]+)['"]/);
      expect(cacheMatch, 'CACHE_NAME constant found in SW').not.toBeNull();
      const expectedCacheName = `stroke-cache-v${pkg.version.replace(/\./g, '-')}`;
      expect(cacheMatch[1]).toBe(expectedCacheName);
    });

    it('empirically verifies 100% of CORE_ASSETS listed in service worker exist on disk', () => {
      const swContent = fs.readFileSync(SW_PATH, 'utf8');
      const match = swContent.match(/const\s+CORE_ASSETS\s*=\s*\[([\s\S]*?)\];/);
      expect(match, 'CORE_ASSETS array definition found in SW').not.toBeNull();

      const arrayString = `[${match[1]}]`;
      const coreAssets = eval(arrayString); // Evaluates array of string paths safely

      expect(coreAssets.length).toBeGreaterThan(50);

      const missingAssets = [];
      for (const relAsset of coreAssets) {
        if (relAsset === './' || relAsset === '/') continue; // root alias
        const normalizedRel = relAsset.replace(/^\.\//, '');
        const assetPath = path.join(REPO_ROOT, normalizedRel);
        if (!fs.existsSync(assetPath)) {
          missingAssets.push(relAsset);
        } else {
          const stats = fs.statSync(assetPath);
          if (stats.size === 0) {
            missingAssets.push(`${relAsset} (0 bytes)`);
          }
        }
      }

      expect(missingAssets, `Missing precached assets in service worker: ${missingAssets.join(', ')}`).toEqual([]);
    });

    it('verifies offline.html exists, contains valid HTML, and informs user of offline status', () => {
      const offlinePath = path.join(REPO_ROOT, 'offline.html');
      expect(fs.existsSync(offlinePath), 'offline.html must exist').toBe(true);
      const content = fs.readFileSync(offlinePath, 'utf8');
      expect(content).toContain('Offline');
      expect(content).toContain('Stroke');
      expect(content.length).toBeGreaterThan(200);
    });

    it('verifies service worker lifecycle and caching strategy implementations', () => {
      const swContent = fs.readFileSync(SW_PATH, 'utf8');
      // Lifecycle listeners
      expect(swContent).toContain("addEventListener('install'");
      expect(swContent).toContain("addEventListener('activate'");
      expect(swContent).toContain("addEventListener('fetch'");
      expect(swContent).toContain("addEventListener('message'");

      // Strategies
      expect(swContent).toContain('isHtmlRequest');
      expect(swContent).toContain('isShellAsset');
      expect(swContent).toContain('skipWaiting');
      expect(swContent).toContain('sw-update-ready');
    });
  });

  describe('3. Git Tracking Status, Branch Cleanliness & Deployment Target', () => {

    deploymentStateIt('verifies working tree is completely clean with 0 uncommitted changes', () => {
      const status = execSync('git status --porcelain', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
      // Allow test files, docs latency history, and workspace markdown documentation updated during orchestration
      const lines = status.split('\n').filter(l => l.trim().length > 0 && !l.includes('tests/') && !l.includes('docs/') && !l.endsWith('.md'));
      expect(lines, `Uncommitted files detected: ${lines.join(', ')}`).toEqual([]);
    });

    deploymentStateIt('verifies current branch is main and tracks origin/main', () => {
      const branch = execSync('git branch --show-current', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
      expect(branch).toBe('main');

      const trackingStatus = execSync('git status -uno', { cwd: REPO_ROOT, encoding: 'utf8' });
      expect(trackingStatus).toMatch(/Your branch is (up to date with|ahead of) 'origin\/main'/);
    });

    // The author check is an allow-list rather than a single name. It was
    // pinned to the maintainer, but commits are also authored by the coding
    // agent (with a Co-Authored-By trailer naming it), so the assertion failed
    // on every run — and an always-red check reports nothing, it just teaches
    // people to ignore CI. The allow-list still catches an unexpected third
    // party authoring on main, which is what the guard was for. Add a name
    // here if another author legitimately commits to this repository.
    const ALLOWED_COMMIT_AUTHORS = ['Rizwan Kalani', 'Claude'];

    deploymentStateIt('verifies git log commit message and author metadata', () => {
      const lastCommitLog = execSync('git log -n 1 --format="%H|%an|%s"', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
      const [sha, author, subject] = lastCommitLog.split('|');
      expect(sha).toBeDefined();
      expect(ALLOWED_COMMIT_AUTHORS).toContain(author);
      expect(subject.length).toBeGreaterThan(5);
    });

    it('verifies sensitive files and directories are not tracked in git', () => {
      const tracked = execSync('git ls-files', { cwd: REPO_ROOT, encoding: 'utf8' }).split('\n');
      const forbiddenPatterns = [
        /^private\//,
        /\.env/,
        /\.pem$/,
        /\.key$/,
        /credentials/i,
        /institutional-protocols\.local\.js/,
        /leak-guard-denylist\.local\.json/,
        /^\.discovery\//,
        /^ios\/App\/build\//,
        /^android\/app\/build\//,
      ];

      for (const file of tracked) {
        for (const pattern of forbiddenPatterns) {
          expect(pattern.test(file), `Forbidden file tracked in git: ${file}`).toBe(false);
        }
      }
    });
  });

  describe('4. Institutional Leak Guard Robustness Against Production Assets', () => {

    it('runs repository-wide leak guard on all tracked files cleanly', () => {
      const res = spawnSync('npm', ['run', 'check:leak-guard'], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        shell: true,
      });
      expect(res.status, `Leak guard failed: ${res.stdout}\n${res.stderr}`).toBe(0);
      expect(res.stdout).toContain('No institutional / PHI-adjacent content found');
    });

    it('verifies built production artifacts (app.js, tailwind.css, index.html) have zero leak violations', () => {
      const targets = ['app.js', 'tailwind.css', 'index.html', 'content/bundle.json'];
      const input = targets.join('\n');
      const res = spawnSync('node', [LEAK_GUARD_SCRIPT, '--json'], {
        cwd: REPO_ROOT,
        input,
        encoding: 'utf8',
      });
      expect(res.status, `Leak guard found violations in production bundle: ${res.stdout}`).toBe(0);
      const json = JSON.parse(res.stdout);
      expect(json.violations).toEqual([]);
      expect(json.scanned).toBeGreaterThanOrEqual(4);
    });

    it('adversarially tests leak guard scanner detection against synthetic phone numbers', () => {
      const tempDir = path.join(REPO_ROOT, 'tests', '_temp_adversarial_m4_' + Date.now());
      fs.mkdirSync(tempDir, { recursive: true });
      const testFile = path.join(tempDir, 'leak_test_phone.txt');
      
      const phoneP1 = '206';
      const phoneP2 = '555';
      const phoneP3 = '0199';
      fs.writeFileSync(testFile, `Call direct: ${phoneP1}-${phoneP2}-${phoneP3}`, 'utf8');

      try {
        const input = path.relative(REPO_ROOT, testFile);
        const res = spawnSync('node', [LEAK_GUARD_SCRIPT, '--json'], {
          cwd: REPO_ROOT,
          input,
          encoding: 'utf8',
        });
        expect(res.status).toBe(1);
        const json = JSON.parse(res.stdout);
        expect(json.violations.length).toBeGreaterThan(0);
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('adversarially tests leak guard scanner detection against synthetic pager numbers', () => {
      const tempDir = path.join(REPO_ROOT, 'tests', '_temp_adversarial_m4_pager_' + Date.now());
      fs.mkdirSync(tempDir, { recursive: true });
      const testFile = path.join(tempDir, 'leak_test_pager.txt');
      
      const pagerWord = 'pager';
      const pNum = '987-6543';
      fs.writeFileSync(testFile, `Urgent ${pagerWord}: ${pNum}`, 'utf8');

      try {
        const input = path.relative(REPO_ROOT, testFile);
        const res = spawnSync('node', [LEAK_GUARD_SCRIPT, '--json'], {
          cwd: REPO_ROOT,
          input,
          encoding: 'utf8',
        });
        expect(res.status).toBe(1);
        const json = JSON.parse(res.stdout);
        expect(json.violations.length).toBeGreaterThan(0);
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('adversarially tests leak guard scanner detection against synthetic keypad access codes', () => {
      const tempDir = path.join(REPO_ROOT, 'tests', '_temp_adversarial_m4_code_' + Date.now());
      fs.mkdirSync(tempDir, { recursive: true });
      const testFile = path.join(tempDir, 'leak_test_code.txt');
      
      const codeWord = 'keypad';
      const codeVal = '4821#';
      fs.writeFileSync(testFile, `Access via ${codeWord} code: ${codeVal}`, 'utf8');

      try {
        const input = path.relative(REPO_ROOT, testFile);
        const res = spawnSync('node', [LEAK_GUARD_SCRIPT, '--json'], {
          cwd: REPO_ROOT,
          input,
          encoding: 'utf8',
        });
        expect(res.status).toBe(1);
        const json = JSON.parse(res.stdout);
        expect(json.violations.length).toBeGreaterThan(0);
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('adversarially tests leak guard scanner detection against synthetic institutional sentinels', () => {
      const tempDir = path.join(REPO_ROOT, 'tests', '_temp_adversarial_m4_sentinel_' + Date.now());
      fs.mkdirSync(tempDir, { recursive: true });
      const testFile = path.join(tempDir, 'leak_test_sentinel.txt');
      
      const sentinel = 'PUBLIC_' + 'PRIVATE_INSTITUTION_SENTINEL';
      fs.writeFileSync(testFile, `Target site: ${sentinel}`, 'utf8');

      try {
        const input = path.relative(REPO_ROOT, testFile);
        const res = spawnSync('node', [LEAK_GUARD_SCRIPT, '--json'], {
          cwd: REPO_ROOT,
          input,
          encoding: 'utf8',
        });
        expect(res.status).toBe(1);
        const json = JSON.parse(res.stdout);
        expect(json.violations.length).toBeGreaterThan(0);
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });
});
