import { it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(__dirname, '..');

it('rejects an unstaged working directory before starting a server or Chromium', () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'stroke-unstaged-qa-'));
  try {
    // A repository-root shell must never stand in for the published allowlist.
    fs.writeFileSync(path.join(fixture, 'index.html'), '<html>repository shell</html>');
    const preload = path.join(fixture, 'startup-guard.mjs');
    fs.writeFileSync(preload, `
      import http from 'node:http';
      import { createRequire } from 'node:module';
      const require = createRequire(${JSON.stringify(path.join(root, 'package.json'))});
      const { chromium } = require('playwright');
      http.createServer = () => { throw new Error('UNEXPECTED_SERVER_START'); };
      chromium.launch = () => { throw new Error('UNEXPECTED_BROWSER_START'); };
    `);
    const result = spawnSync(process.execPath, ['--import', preload, path.join(root, 'scripts/qa-smoke.mjs'), '--local-only'], {
      cwd: fixture, encoding: 'utf8', timeout: 10000,
    });
    expect(result.error).toBeUndefined();
    expect(result.signal).toBeNull();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Published QA artifact missing. Run npm run publish:stage or supply an explicit --site-dir.');
    expect(result.stderr).not.toMatch(/UNEXPECTED_(SERVER|BROWSER)_START/);
    expect(fs.existsSync(path.join(fixture, 'output/playwright/qa-smoke-report.json'))).toBe(false);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});
