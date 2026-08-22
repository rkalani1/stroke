#!/usr/bin/env node
// scripts/wait-for-live-pages.mjs
//
// Blocks until the live GitHub Pages deployment serves byte-identical copies of
// this checkout's public artifacts, so a job that probes the live site does not
// read a half-swapped deploy.
//
// Why this exists: ci.yml's adaptive-latency-smoke job probes the *live* site,
// but it starts the moment main is pushed — concurrently with the
// `pages build and deployment` run whose output it is measuring. It therefore
// raced the deploy on every main merge and read a partly-swapped site. Two
// independent observations pin it down:
//
//   • v6.20.1 (e9ae449): job 08:23:58-08:24:46, Pages finished 08:24:05 -> red.
//     Re-run 08:27:41-08:28:26, after the deploy -> green, no code change.
//   • v6.19.4 (8a13c27): job 13:06:05-13:06:52, Pages finished 13:07:07 -> red.
//     Re-run 13:09:10-13:09:55, after the deploy -> green, no code change.
//
// The failure was functional (`Runs: 8 | Issues: 1`), not a latency breach —
// the slowest run was 7886 ms against a 50000 ms live/mobile threshold. So the
// gate is correct to be hard; it was just being asked the question too early.
// This waits for the deploy instead of weakening the gate.
//
// lighthouse.yml and live-smoke.yml each carry their own inline copy of this
// polling logic. This is the shared implementation they can migrate to; it is
// deliberately behaviour-compatible with both so that migration is mechanical.

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

// Two different bases, deliberately. PUBLIC_BASE is the origin baked into the
// data indexes, so it is what artifact URLs in those files are parsed against
// and must not be overridden. PROBE_BASE is where we actually fetch from; it is
// overridable so this script can be exercised against a local static server.
const PUBLIC_BASE = 'https://rkalani1.github.io/stroke/';
const PROBE_BASE = process.env.STROKE_LIVE_BASE_URL || PUBLIC_BASE;
const TIMEOUT_MS = Number(process.env.STROKE_LIVE_WAIT_TIMEOUT_MS || 600000);
const POLL_MS = Number(process.env.STROKE_LIVE_WAIT_POLL_MS || 10000);
const REVISION = process.env.GITHUB_SHA || 'local';

// Mirrors the shell/node block in lighthouse.yml and live-smoke.yml: the fixed
// shell plus every artifact the two data indexes advertise as publicly served.
const BASE_ARTIFACTS = [
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
];

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function collectArtifacts() {
  const artifacts = new Set(BASE_ARTIFACTS);
  const missing = [];

  const toRel = (url) =>
    typeof url === 'string' && url.startsWith(PUBLIC_BASE)
      ? url.slice(PUBLIC_BASE.length)
      : null;

  const add = (rel) => {
    if (!rel) return;
    if (!existsSync(rel)) {
      missing.push(rel);
      return;
    }
    artifacts.add(rel);
  };

  const apiIndex = JSON.parse(readFileSync('data/index.json', 'utf8'));
  for (const endpoint of apiIndex.endpoints || []) add(toRel(endpoint));

  const guidelineIndex = JSON.parse(readFileSync('data/guidelines/index.json', 'utf8'));
  for (const guideline of guidelineIndex.data || []) add(toRel(guideline.url));

  if (missing.length > 0) {
    for (const rel of missing) {
      console.error(`Advertised public artifact missing locally: ${rel}`);
    }
    process.exit(1);
  }

  return [...artifacts].sort();
}

// One attempt returns true only when the live bytes equal the local bytes.
// Any network error, non-2xx, or mismatch is a "not yet" rather than a throw,
// because a deploy in flight legitimately produces all three.
async function matchesLive(artifact, expected, attempt) {
  const url = `${PROBE_BASE}${artifact}?sha=${REVISION}&artifact_try=${attempt}`;
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return false;
    const body = Buffer.from(await response.arrayBuffer());
    return sha256(body) === expected;
  } catch {
    return false;
  }
}

async function waitFor(artifact, expected, deadline) {
  for (let attempt = 1; ; attempt += 1) {
    if (await matchesLive(artifact, expected, attempt)) return true;
    if (Date.now() >= deadline) return false;
    await sleep(POLL_MS);
  }
}

async function main() {
  const artifacts = collectArtifacts();
  const deadline = Date.now() + TIMEOUT_MS;

  const expected = new Map(
    artifacts.map((artifact) => [artifact, sha256(readFileSync(artifact))])
  );

  // app.js first: it is the largest artifact and the last to settle, so gating
  // on it up front means the remaining checks almost always pass first try
  // rather than each paying its own poll interval.
  if (!(await waitFor('app.js', expected.get('app.js'), deadline))) {
    console.error('Timed out waiting for live Pages app.js to match this commit.');
    process.exit(1);
  }
  console.log('Live Pages app.js matches checked-out commit.');

  for (const artifact of artifacts) {
    if (artifact === 'app.js') continue;
    if (!(await waitFor(artifact, expected.get(artifact), deadline))) {
      console.error(
        `Timed out waiting for live Pages artifact to match this commit: ${artifact}`
      );
      process.exit(1);
    }
  }

  console.log(
    `Live Pages shell and public data artifacts match checked-out commit (${artifacts.length} files).`
  );
}

main().catch((error) => {
  console.error(error?.stack || String(error));
  process.exit(1);
});
