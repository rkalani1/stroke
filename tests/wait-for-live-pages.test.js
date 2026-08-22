// tests/wait-for-live-pages.test.js
//
// Guards the deploy-race fix: ci.yml's adaptive-latency-smoke job probes the
// LIVE site but starts concurrently with the `pages build and deployment` run
// it measures, so without a wait it reads a half-swapped deploy and fails on
// every main merge. Reproduced identically on e9ae449 (v6.20.1) and 8a13c27
// (v6.19.4); both went green on re-run after the deploy settled.
//
// The structural assertions keep the gate wired up; the behavioural ones run
// the script against a local static server so the polling, hashing, and each
// failure path are actually exercised rather than assumed.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const ciWorkflow = readFileSync(join(repoRoot, '.github/workflows/ci.yml'), 'utf8');
const script = readFileSync(join(repoRoot, 'scripts/wait-for-live-pages.mjs'), 'utf8');
const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));

const PUBLIC_BASE = 'https://rkalani1.github.io/stroke/';

describe('live Pages deploy-race guard (structure)', () => {
  it('gates the live smoke job on the deploy, before the QA step runs', () => {
    expect(pkg.scripts['qa:wait-for-live-pages']).toBe('node ./scripts/wait-for-live-pages.mjs');
    expect(ciWorkflow).toContain('- name: Wait for live Pages deployment');
    expect(ciWorkflow).toContain('run: npm run qa:wait-for-live-pages');

    // Ordering is the whole point: waiting after the probe would be useless.
    const waitAt = ciWorkflow.indexOf('- name: Wait for live Pages deployment');
    const probeAt = ciWorkflow.indexOf('- name: Run adaptive strict QA (local + live)');
    expect(waitAt).toBeGreaterThan(-1);
    expect(probeAt).toBeGreaterThan(-1);
    expect(waitAt).toBeLessThan(probeAt);
  });

  it('only waits on main, where a Pages deploy is actually in flight', () => {
    const waitAt = ciWorkflow.indexOf('- name: Wait for live Pages deployment');
    const stepBlock = ciWorkflow.slice(waitAt, waitAt + 200);
    expect(stepBlock).toContain("if: github.ref == 'refs/heads/main'");
  });

  it('keeps the strict QA gate hard rather than papering over the race', () => {
    // The failure was functional (Issues: 1), not a latency breach -- the
    // slowest run was 7886 ms against a 50000 ms live/mobile threshold. If a
    // later change makes this job advisory, that is a real weakening and this
    // test should fail loudly rather than let it pass unnoticed.
    const jobAt = ciWorkflow.indexOf('adaptive-latency-smoke:');
    const probeAt = ciWorkflow.indexOf('- name: Run adaptive strict QA (local + live)', jobAt);
    const uploadAt = ciWorkflow.indexOf('- name: Upload adaptive latency smoke artifacts', probeAt);
    expect(ciWorkflow.slice(probeAt, uploadAt)).not.toContain('continue-on-error');
  });

  it('parses artifact URLs against the fixed public origin, not the probe origin', () => {
    // Overriding the probe base must not silently shrink the artifact set: if
    // toRel() used the overridable base, every URL in the data indexes would
    // stop matching and the check would pass while verifying almost nothing.
    expect(script).toContain("const PUBLIC_BASE = 'https://rkalani1.github.io/stroke/';");
    expect(script).toContain('url.startsWith(PUBLIC_BASE)');
    expect(script).toContain('url.slice(PUBLIC_BASE.length)');
    expect(script).toContain('${PROBE_BASE}${artifact}');
  });
});

// ---------------------------------------------------------------------------
// Behavioural: serve the real artifacts over loopback and drive the script.
// ---------------------------------------------------------------------------

function collectArtifacts() {
  const artifacts = new Set([
    'index.html',
    'tailwind.css',
    'offline.html',
    'app.js',
    'data/index.json',
    'llms.txt',
    'llms-full.txt',
    'manifest.json',
    'service-worker.js',
    'robots.txt',
    'sitemap.xml'
  ]);
  const toRel = (url) =>
    typeof url === 'string' && url.startsWith(PUBLIC_BASE) ? url.slice(PUBLIC_BASE.length) : null;
  const apiIndex = JSON.parse(readFileSync(join(repoRoot, 'data/index.json'), 'utf8'));
  for (const endpoint of apiIndex.endpoints || []) {
    const rel = toRel(endpoint);
    if (rel) artifacts.add(rel);
  }
  const guidelineIndex = JSON.parse(
    readFileSync(join(repoRoot, 'data/guidelines/index.json'), 'utf8')
  );
  for (const guideline of guidelineIndex.data || []) {
    const rel = toRel(guideline.url);
    if (rel) artifacts.add(rel);
  }
  return [...artifacts];
}

// `overrides` lets a test serve stale bytes for one path, standing in for the
// half-swapped state the live CDN is in mid-deploy.
let overrides = new Map();
let server;
let origin;

beforeAll(async () => {
  server = createServer((req, res) => {
    const rel = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^[/\\]+/, '');
    if (overrides.has(rel)) {
      res.writeHead(200);
      res.end(overrides.get(rel));
      return;
    }
    const abs = join(repoRoot, rel);
    if (!abs.startsWith(repoRoot) || !existsSync(abs)) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    res.writeHead(200);
    res.end(readFileSync(abs));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}/`;
});

afterAll(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
});

// Async on purpose: spawnSync would block this process's event loop, and the
// static server under test lives in that same loop -- the child would hang
// forever waiting on a server that cannot answer.
function runScriptWith(env) {
  return new Promise((resolve) => {
    const child = spawn('node', [join(repoRoot, 'scripts/wait-for-live-pages.mjs')], {
      cwd: repoRoot,
      env: {
        ...process.env,
        NO_PROXY: '127.0.0.1',
        no_proxy: '127.0.0.1',
        HTTP_PROXY: '',
        HTTPS_PROXY: '',
        http_proxy: '',
        https_proxy: '',
        ...env
      }
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('close', (status) => resolve({ status, stdout, stderr }));
  });
}

function runScript({ timeoutMs = 2500, pollMs = 250 } = {}) {
  return runScriptWith({
    STROKE_LIVE_BASE_URL: origin,
    STROKE_LIVE_WAIT_TIMEOUT_MS: String(timeoutMs),
    STROKE_LIVE_WAIT_POLL_MS: String(pollMs)
  });
}

describe('live Pages deploy-race guard (behaviour)', () => {
  it('passes once every advertised artifact is served byte-identical', async () => {
    overrides = new Map();
    const res = await runScript({ timeoutMs: 20000, pollMs: 250 });
    expect(res.stderr).toBe('');
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('Live Pages app.js matches checked-out commit.');

    // The count in the success line must reflect the full advertised set, so a
    // silently-shrunk artifact list cannot masquerade as a passing check.
    const expected = collectArtifacts().length;
    expect(expected).toBeGreaterThan(100);
    expect(res.stdout).toContain(`(${expected} files)`);
  });

  it('fails when app.js is still the previous deploy', async () => {
    overrides = new Map([['app.js', '/* stale previous deploy */\n']]);
    const res = await runScript();
    expect(res.status).toBe(1);
    expect(res.stderr).toContain('Timed out waiting for live Pages app.js to match this commit.');
  });

  it('names the offending artifact when app.js is fresh but a data file lags', async () => {
    overrides = new Map([['data/index.json', '{"stale":true}\n']]);
    const res = await runScript();
    expect(res.status).toBe(1);
    expect(res.stdout).toContain('Live Pages app.js matches checked-out commit.');
    expect(res.stderr).toContain(
      'Timed out waiting for live Pages artifact to match this commit: data/index.json'
    );
  });

  it('treats an unreachable origin as "not deployed yet", not a crash', async () => {
    const res = await runScriptWith({
      // Port 1 is reserved and never listening.
      STROKE_LIVE_BASE_URL: 'http://127.0.0.1:1/',
      STROKE_LIVE_WAIT_TIMEOUT_MS: '1200',
      STROKE_LIVE_WAIT_POLL_MS: '200'
    });
    expect(res.status).toBe(1);
    expect(res.stderr).toContain('Timed out waiting for live Pages app.js');
    expect(res.stderr).not.toMatch(/ECONNREFUSED[\s\S]*at /);
  });

  it('hashes the real bytes rather than trusting a 200', async () => {
    // A 200 that returns the wrong body is exactly the mid-deploy case, so a
    // status-only check would let the race straight through.
    const local = readFileSync(join(repoRoot, 'app.js'));
    const localHash = createHash('sha256').update(local).digest('hex');
    overrides = new Map([['app.js', Buffer.concat([local, Buffer.from('\n')])]]);
    const mutatedHash = createHash('sha256').update(overrides.get('app.js')).digest('hex');
    expect(mutatedHash).not.toBe(localHash);

    const res = await runScript();
    expect(res.status).toBe(1);
    expect(res.stderr).toContain('Timed out waiting for live Pages app.js to match this commit.');
  });
});
