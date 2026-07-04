// Public-safety CI guard — scans the BUILT, shipped artifacts (app.js bundle
// and index.html) to ensure no real, named-institution identifier leaks into
// the deployed public site. The public stroke app must remain institution-
// neutral; institution-specific curriculum lives only in the gitignored
// private layer, never in the public bundle.
//
// This test runs against the committed build output. Run `npm run build`
// before this test if you have changed any source under src/.
//
// Legitimate `rkalani1.github.io` deploy-URL strings are excluded: that host
// contains no banned token, so it never matches the pattern below.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

// Banned real-institution identifiers. Case-insensitive. The \b...\b anchored
// tokens (SCH, UWMC) avoid matching innocuous substrings such as "school",
// "schema", or "framework". No disclaimer exemptions: as of 2026-07 even the
// "not approved for <institution>" negative disclaimers are banned — public
// safety copy must stay institution-neutral.
const BANNED = new RegExp([
  'harborview',
  'HMC',
  'UW Medic',
  ['university', 'of', 'washington'].join(' '),
  'UW Neurology',
  'UW School of Medicine',
  'montlake',
  'VA Puget Sound',
  'UWMC',
  'Seattle Children',
  '\\bSCH\\b'
].join('|'), 'i');

// Per-token regexes so a failure message can name exactly what leaked.
// Identity tokens: the last-name pattern skips the unavoidable rkalani1.github.io GitHub
// Pages origin in canonical URLs while catching any personal name or email.
const TOKENS = [
  /harborview/i,
  /HMC/i,
  /UW Medic/i,
  new RegExp(['university', 'of', 'washington'].join(' '), 'i'),
  /UW Neurology/i,
  /UW School of Medicine/i,
  /montlake/i,
  /VA Puget Sound/i,
  /UWMC/i,
  /Seattle Children/i,
  /\bSCH\b/i,
  new RegExp('riz' + 'wan', 'i'),
  new RegExp('ka' + 'lani(?!1)', 'i'),
  new RegExp(['washington', 'edu'].join('\\.'), 'i'),
  new RegExp('\\b' + ['uw', 'edu'].join('\\.'), 'i'),
];

function readBuiltArtifact(relPath) {
  try {
    return readFileSync(join(repoRoot, relPath), 'utf8');
  } catch (err) {
    throw new Error(
      `Could not read built artifact "${relPath}". Run \`npm run build\` first. (${err.message})`
    );
  }
}

// Strip lines that only match because of the legitimate deploy URL, so we never
// false-positive on rkalani1.github.io (which contains no banned token anyway,
// but we filter defensively in case a future URL embeds a substring).
function offendingLines(content) {
  return content
    .split('\n')
    .map((line, idx) => ({ line, n: idx + 1 }))
    .filter(({ line }) => BANNED.test(line))
    .filter(({ line }) => !/rkalani1\.github\.io/i.test(line) || BANNED.test(line.replace(/rkalani1\.github\.io/gi, '')));
}

describe('public-safety: no institutional identifiers in the built bundle', () => {
  it('app.js (built esbuild bundle) contains no real-institution identifiers', () => {
    const content = readBuiltArtifact('app.js');
    const leaked = TOKENS.filter((t) => t.test(content)).map((t) => t.source);
    expect(
      leaked,
      `Built app.js leaked banned institutional identifier(s): ${leaked.join(', ')}. ` +
        `Scrub them from src/ and rebuild. Institution-specific content belongs in the private layer.`
    ).toEqual([]);
  });

  it('app.js has zero offending lines after excluding the deploy URL', () => {
    const content = readBuiltArtifact('app.js');
    const offenders = offendingLines(content);
    expect(
      offenders.length,
      `app.js has ${offenders.length} line(s) with banned identifiers (deploy-URL lines excluded).`
    ).toBe(0);
  });

  it('index.html contains no real-institution identifiers', () => {
    const content = readBuiltArtifact('index.html');
    const leaked = TOKENS.filter((t) => t.test(content)).map((t) => t.source);
    expect(
      leaked,
      `index.html leaked banned institutional identifier(s): ${leaked.join(', ')}.`
    ).toEqual([]);
  });
});
