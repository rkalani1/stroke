// Public-safety CI guard -- scans the BUILT, shipped artifacts (app.js bundle
// and index.html) to ensure no private/local sentinel identifier leaks into
// the deployed public site. The public stroke app must remain institution-
// neutral; institution-specific curriculum lives only in the gitignored
// private layer, never in the public bundle.
//
// This test runs against the committed build output. Run `npm run build`
// before this test if you have changed any source under src/.
//
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

const sentinel = (...parts) => parts.join('_');
const TOKENS = [
  new RegExp(sentinel('PUBLIC', 'PRIVATE', 'INSTITUTION', 'SENTINEL')),
  new RegExp(sentinel('PUBLIC', 'PRIVATE', 'IDENTITY', 'SENTINEL')),
  new RegExp(sentinel('PUBLIC', 'PRIVATE', 'LITERAL', 'SENTINEL')),
  new RegExp(sentinel('PRIVATE', 'SOURCE', 'ATTACHMENT', 'SENTINEL')),
  new RegExp(sentinel('PRIVATE', 'LOCAL', 'CONTACT', 'SENTINEL'))
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

function offendingLines(content) {
  return content
    .split('\n')
    .map((line, idx) => ({ line, n: idx + 1 }))
    .filter(({ line }) => TOKENS.some((token) => token.test(line)));
}

describe('public-safety: no private/local sentinel identifiers in the built bundle', () => {
  it('app.js (built esbuild bundle) contains no private sentinels', () => {
    const content = readBuiltArtifact('app.js');
    const leaked = TOKENS.filter((t) => t.test(content)).map((t) => t.source);
    expect(
      leaked,
      `Built app.js leaked banned private sentinel(s): ${leaked.join(', ')}. ` +
        `Scrub them from src/ and rebuild. Institution-specific content belongs in the private layer.`
    ).toEqual([]);
  });

  it('app.js has zero offending lines after excluding the deploy URL', () => {
    const content = readBuiltArtifact('app.js');
    const offenders = offendingLines(content);
    expect(
      offenders.length,
      `app.js has ${offenders.length} line(s) with private sentinels.`
    ).toBe(0);
  });

  it('index.html contains no private sentinels', () => {
    const content = readBuiltArtifact('index.html');
    const leaked = TOKENS.filter((t) => t.test(content)).map((t) => t.source);
    expect(
      leaked,
      `index.html leaked banned private sentinel(s): ${leaked.join(', ')}.`
    ).toEqual([]);
  });
});
