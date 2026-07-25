import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import process from 'node:process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const guardScript = join(repoRoot, 'scripts/check-no-institutional-leak.mjs');
const denylistFile = join(repoRoot, 'scripts/leak-guard-denylist.json');
const stagedGuardScript = join(repoRoot, 'scripts/check-staged-leak-guard.sh');

function withTempRepo(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'stroke-leak-guard-'));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function runGuard(cwd, files, args = []) {
  return spawnSync(process.execPath, [guardScript, ...args], {
    cwd,
    input: files.join('\n') + '\n',
    encoding: 'utf8'
  });
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function writePrivateDenylist(dir, sentinel) {
  const privateDenylist = join(dir, 'private-denylist.json');
  writePrivateDenylistFile(privateDenylist, sentinel);
  return privateDenylist;
}

function writePrivateDenylistFile(file, sentinel) {
  writeFileSync(file, JSON.stringify({
    literalSha256Denylist: [
      {
        sha256: sha256(sentinel.toLowerCase()),
        normalization: 'text',
        tier: 'phi',
        label: 'synthetic private sentinel hash'
      }
    ]
  }, null, 2), 'utf8');
}

describe('leak guard scanner', () => {
  it('keeps committed exact-token hash denylist empty', () => {
    const publicDenylist = JSON.parse(readFileSync(denylistFile, 'utf8'));
    expect(publicDenylist.literalSha256Denylist).toEqual([]);
    expect(JSON.stringify(publicDenylist)).not.toMatch(/[a-f0-9]{64}/i);
  });

  it('loads private exact-token hashes without echoing the matched text', () => {
    withTempRepo((dir) => {
      mkdirSync(join(dir, 'tests'), { recursive: true });
      const sentinel = 'PRIVATE_HASH_SENTINEL';
      const privateDenylist = writePrivateDenylist(dir, sentinel);
      writeFileSync(join(dir, 'tests/fixture.js'), `export const name = "${sentinel}";\n`, 'utf8');

      const result = spawnSync(process.execPath, [guardScript], {
        cwd: dir,
        input: 'tests/fixture.js\n',
        encoding: 'utf8',
        env: {
          ...process.env,
          STROKE_LEAK_GUARD_PRIVATE_DENYLIST: privateDenylist
        }
      });

      expect(result.status).toBe(1);
      expect(result.stdout).toContain('Leak guard: scanned 1 text file(s).');
      expect(result.stderr).toContain('Literal hash denylist');
      expect(result.stderr).toContain('[redacted hash-denylist match on this line]');
      expect(result.stderr).not.toContain(sentinel);
    });
  });

  it('fails closed when a private denylist is required but missing', () => {
    withTempRepo((dir) => {
      writeFileSync(join(dir, 'fixture.txt'), 'clean\n', 'utf8');

      const result = spawnSync(process.execPath, [guardScript], {
        cwd: dir,
        input: 'fixture.txt\n',
        encoding: 'utf8',
        env: {
          ...process.env,
          STROKE_LEAK_GUARD_PRIVATE_DENYLIST: '',
          STROKE_LEAK_GUARD_REQUIRE_PRIVATE: '1'
        }
      });

      expect(result.status).toBe(1);
      expect(result.stderr).toContain('private denylist required');
      expect(result.stderr).toContain('scripts/leak-guard-denylist.local.json');
    });
  });

  it('fails closed when a required private denylist has no scan rules', () => {
    withTempRepo((dir) => {
      const emptyPrivateDenylist = join(dir, 'empty-private-denylist.json');
      writeFileSync(emptyPrivateDenylist, JSON.stringify({
        institutionalTokens: [],
        identityTokens: [],
        phiPatterns: [],
        literalDenylist: [],
        literalSha256Denylist: []
      }), 'utf8');
      writeFileSync(join(dir, 'fixture.txt'), 'clean\n', 'utf8');

      const result = spawnSync(process.execPath, [guardScript], {
        cwd: dir,
        input: 'fixture.txt\n',
        encoding: 'utf8',
        env: {
          ...process.env,
          STROKE_LEAK_GUARD_PRIVATE_DENYLIST: emptyPrivateDenylist,
          STROKE_LEAK_GUARD_REQUIRE_PRIVATE: '1'
        }
      });

      expect(result.status).toBe(1);
      expect(result.stderr).toContain('private scan rules');
    });
  });

  it('redacts PHI-shaped pattern matches in terminal output', () => {
    withTempRepo((dir) => {
      const phoneLikeValue = ['555', '555', '1212'].join('-');
      writeFileSync(join(dir, 'fixture.txt'), `Call ${phoneLikeValue}\n`, 'utf8');

      const result = runGuard(dir, ['fixture.txt']);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain('Phone-number-shaped token');
      expect(result.stderr).toContain('[redacted PHI-pattern match on this line]');
      expect(result.stderr).not.toContain(phoneLikeValue);
    });
  });

  it('staged helper scans staged blobs rather than cleaned working-tree files', () => {
    withTempRepo((dir) => {
      mkdirSync(join(dir, 'scripts'), { recursive: true });
      symlinkSync(guardScript, join(dir, 'scripts/check-no-institutional-leak.mjs'));
      symlinkSync(denylistFile, join(dir, 'scripts/leak-guard-denylist.json'));
      symlinkSync(stagedGuardScript, join(dir, 'scripts/check-staged-leak-guard.sh'));
      const sentinel = 'PRIVATE_STAGED_SENTINEL';
      const privateDenylist = writePrivateDenylist(dir, sentinel);

      expect(spawnSync('git', ['init'], { cwd: dir, encoding: 'utf8' }).status).toBe(0);
      const fixture = join(dir, 'fixture.txt');
      writeFileSync(fixture, 'clean\n', 'utf8');
      expect(spawnSync('git', ['add', 'fixture.txt'], { cwd: dir, encoding: 'utf8' }).status).toBe(0);
      writeFileSync(fixture, `${sentinel}\n`, 'utf8');
      expect(spawnSync('git', ['add', 'fixture.txt'], { cwd: dir, encoding: 'utf8' }).status).toBe(0);
      writeFileSync(fixture, 'clean\n', 'utf8');

      const result = spawnSync('sh', ['scripts/check-staged-leak-guard.sh'], {
        cwd: dir,
        encoding: 'utf8',
        env: {
          ...process.env,
          STROKE_LEAK_GUARD_PRIVATE_DENYLIST: privateDenylist
        }
      });

      expect(result.status).toBe(1);
      expect(result.stderr).toContain('Literal hash denylist');
      expect(result.stderr).toContain('[redacted hash-denylist match on this line]');
      expect(result.stderr).not.toContain(sentinel);
    });
  });

  it('staged helper loads the default gitignored local private denylist', () => {
    withTempRepo((dir) => {
      mkdirSync(join(dir, 'scripts'), { recursive: true });
      symlinkSync(guardScript, join(dir, 'scripts/check-no-institutional-leak.mjs'));
      symlinkSync(denylistFile, join(dir, 'scripts/leak-guard-denylist.json'));
      symlinkSync(stagedGuardScript, join(dir, 'scripts/check-staged-leak-guard.sh'));
      const sentinel = 'PRIVATE_LOCAL_STAGED_SENTINEL';
      writePrivateDenylistFile(join(dir, 'scripts/leak-guard-denylist.local.json'), sentinel);

      expect(spawnSync('git', ['init'], { cwd: dir, encoding: 'utf8' }).status).toBe(0);
      writeFileSync(join(dir, 'fixture.txt'), `${sentinel}\n`, 'utf8');
      expect(spawnSync('git', ['add', 'fixture.txt'], { cwd: dir, encoding: 'utf8' }).status).toBe(0);

      const result = spawnSync('sh', ['scripts/check-staged-leak-guard.sh'], {
        cwd: dir,
        encoding: 'utf8',
        env: {
          ...process.env,
          STROKE_LEAK_GUARD_PRIVATE_DENYLIST: ''
        }
      });

      expect(result.status).toBe(1);
      expect(result.stderr).toContain('Literal hash denylist');
      expect(result.stderr).toContain('[redacted hash-denylist match on this line]');
      expect(result.stderr).not.toContain(sentinel);
    });
  });

  it('staged helper refuses to stage the private denylist itself', () => {
    withTempRepo((dir) => {
      mkdirSync(join(dir, 'scripts'), { recursive: true });
      symlinkSync(guardScript, join(dir, 'scripts/check-no-institutional-leak.mjs'));
      symlinkSync(denylistFile, join(dir, 'scripts/leak-guard-denylist.json'));
      symlinkSync(stagedGuardScript, join(dir, 'scripts/check-staged-leak-guard.sh'));

      expect(spawnSync('git', ['init'], { cwd: dir, encoding: 'utf8' }).status).toBe(0);
      writeFileSync(join(dir, 'scripts/leak-guard-denylist.local.json'), '{"literalDenylist":["PRIVATE"]}\n', 'utf8');
      expect(spawnSync('git', ['add', 'scripts/leak-guard-denylist.local.json'], { cwd: dir, encoding: 'utf8' }).status).toBe(0);

      const result = spawnSync('sh', ['scripts/check-staged-leak-guard.sh'], {
        cwd: dir,
        encoding: 'utf8'
      });

      expect(result.status).toBe(1);
      expect(result.stderr).toContain('scripts/leak-guard-denylist.local.json is private');
    });
  });

  it('staged helper requires private denylist coverage', () => {
    withTempRepo((dir) => {
      mkdirSync(join(dir, 'scripts'), { recursive: true });
      symlinkSync(guardScript, join(dir, 'scripts/check-no-institutional-leak.mjs'));
      symlinkSync(denylistFile, join(dir, 'scripts/leak-guard-denylist.json'));
      symlinkSync(stagedGuardScript, join(dir, 'scripts/check-staged-leak-guard.sh'));

      expect(spawnSync('git', ['init'], { cwd: dir, encoding: 'utf8' }).status).toBe(0);
      writeFileSync(join(dir, 'fixture.txt'), 'clean\n', 'utf8');
      expect(spawnSync('git', ['add', 'fixture.txt'], { cwd: dir, encoding: 'utf8' }).status).toBe(0);

      const result = spawnSync('sh', ['scripts/check-staged-leak-guard.sh'], {
        cwd: dir,
        encoding: 'utf8',
        env: {
          ...process.env,
          STROKE_LEAK_GUARD_PRIVATE_DENYLIST: ''
        }
      });

      expect(result.status).toBe(1);
      expect(result.stderr).toContain('private denylist required');
      expect(result.stderr).toContain('scripts/leak-guard-denylist.local.json');
    });
  });

  it('staged helper rejects a present but empty private denylist', () => {
    withTempRepo((dir) => {
      mkdirSync(join(dir, 'scripts'), { recursive: true });
      symlinkSync(guardScript, join(dir, 'scripts/check-no-institutional-leak.mjs'));
      symlinkSync(denylistFile, join(dir, 'scripts/leak-guard-denylist.json'));
      symlinkSync(stagedGuardScript, join(dir, 'scripts/check-staged-leak-guard.sh'));
      writeFileSync(join(dir, 'scripts/leak-guard-denylist.local.json'), '{}\n', 'utf8');

      expect(spawnSync('git', ['init'], { cwd: dir, encoding: 'utf8' }).status).toBe(0);
      writeFileSync(join(dir, 'fixture.txt'), 'clean\n', 'utf8');
      expect(spawnSync('git', ['add', 'fixture.txt'], { cwd: dir, encoding: 'utf8' }).status).toBe(0);

      const result = spawnSync('sh', ['scripts/check-staged-leak-guard.sh'], {
        cwd: dir,
        encoding: 'utf8',
        env: {
          ...process.env,
          STROKE_LEAK_GUARD_PRIVATE_DENYLIST: ''
        }
      });

      expect(result.status).toBe(1);
      expect(result.stderr).toContain('private scan rules');
    });
  });
});
