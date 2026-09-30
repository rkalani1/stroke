import { describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, copyFileSync, writeFileSync, openSync, closeSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import process from 'node:process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const guardScript = join(repoRoot, 'scripts/check-no-institutional-leak.mjs');
const denylistFile = join(repoRoot, 'scripts/leak-guard-denylist.json');
const stagedGuardScript = join(repoRoot, 'scripts/check-staged-leak-guard.sh');

function getShExecutable() {
  if (process.platform !== 'win32') return 'sh';
  try {
    const testRes = spawnSync('sh', ['-c', 'exit 0']);
    if (testRes.status === 0) return 'sh';
  } catch {}
  const gitSh = 'C:\\Program Files\\Git\\bin\\sh.exe';
  if (existsSync(gitSh)) return gitSh;
  const gitUsrSh = 'C:\\Program Files\\Git\\usr\\bin\\sh.exe';
  if (existsSync(gitUsrSh)) return gitUsrSh;
  return 'sh';
}
const shCmd = getShExecutable();

function linkOrCopy(src, dest) {
  try {
    symlinkSync(src, dest);
  } catch {
    copyFileSync(src, dest);
  }
}

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

async function withAsyncTempRepo(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'stroke-leak-guard-'));
  try {
    return await fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function runGuardWithDelayedTail(cwd, head, tail) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [guardScript, '--json'], {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, STROKE_LEAK_GUARD_PRIVATE_DENYLIST: '', STROKE_LEAK_GUARD_REQUIRE_PRIVATE: '' }
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    // An early-exiting broken guard may close its pipe. The exit/output below
    // must fail the assertion instead of turning EPIPE into a test-runner error.
    child.stdin.on('error', () => {});
    child.once('error', reject);
    child.stdin.write(head);
    const tailTimer = setTimeout(() => child.stdin.end(tail), 100);
    child.once('close', status => {
      clearTimeout(tailTimer);
      resolve({ status, stdout, stderr });
    });
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
  it('scans a large piped list completely rather than passing with zero files', () => {
    withTempRepo((dir) => {
      writeFileSync(join(dir, 'clean.txt'), 'Clean synthetic content.\n', 'utf8');
      const result = runGuard(dir, Array(20000).fill('clean.txt'), ['--json']);
      expect(result.status).toBe(0);
      const report = JSON.parse(result.stdout);
      expect(report.scanned).toBe(20000);
      expect(report.violations).toEqual([]);
      expect(report.error).toBeUndefined();
    });
  });

  it('waits for a delayed tail and detects its violation after a large clean prefix', async () => {
    await withAsyncTempRepo(async (dir) => {
      writeFileSync(join(dir, 'clean.txt'), 'Clean synthetic content.\n', 'utf8');
      const phoneLikeValue = ['555', '555', '1212'].join('-');
      writeFileSync(join(dir, 'tail.txt'), `Call ${phoneLikeValue}\n`, 'utf8');
      const result = await runGuardWithDelayedTail(dir, 'clean.txt\n'.repeat(20000), 'tail.txt\n');
      expect(result.status).toBe(1);
      const report = JSON.parse(result.stdout);
      expect(report.scanned).toBe(20001);
      expect(report.violations).toContainEqual(expect.objectContaining({ file: 'tail.txt', tier: 'phi' }));
      expect(result.stdout + result.stderr).not.toContain(phoneLikeValue);
      expect(report.error).toBeUndefined();
    });
  });

  it.each([false, true])('fails closed on a partial stdin stream error (JSON: %s)', (json) => {
    withTempRepo((dir) => {
      writeFileSync(join(dir, 'clean.txt'), 'Clean synthetic content.\n', 'utf8');
      const preload = join(dir, 'broken-stdin.mjs');
      writeFileSync(preload, `import { Readable } from 'node:stream';
Object.defineProperty(process, 'stdin', { value: Readable.from((async function* () {
  yield 'clean.txt\\n';
  throw new Error('synthetic stdin failure detail');
})()) });\n`, 'utf8');
      const result = spawnSync(process.execPath, ['--import', preload, guardScript, ...(json ? ['--json'] : []), 'clean.txt'], {
        cwd: dir,
        input: '',
        encoding: 'utf8',
        env: { ...process.env, STROKE_LEAK_GUARD_PRIVATE_DENYLIST: '', STROKE_LEAK_GUARD_REQUIRE_PRIVATE: '' }
      });
      expect(result.status).toBe(1);
      expect(result.stdout + result.stderr).toContain('could not read the complete file list');
      expect(result.stdout + result.stderr).not.toContain('synthetic stdin failure detail');
      if (json) {
        const report = JSON.parse(result.stdout);
        expect(report.scanned).toBe(0);
        expect(report.error).toContain('scan not performed');
      } else {
        expect(result.stdout).not.toContain('PASS');
      }
    });
  });

  it.skipIf(process.platform === 'win32')('rejects a real directory stdin descriptor instead of treating it as empty', () => {
    withTempRepo((dir) => {
      const input = openSync(dir, 'r');
      try {
        const result = spawnSync(process.execPath, [guardScript, '--json'], {
          cwd: dir, stdio: [input, 'pipe', 'pipe'], encoding: 'utf8'
        });
        expect(result.status).toBe(1);
        const report = JSON.parse(result.stdout);
        expect(report.scanned).toBe(0);
        expect(report.error).toContain('could not read the complete file list');
      } finally {
        closeSync(input);
      }
    });
  });

  it('preserves argv, UTF-8 and mixed stdin separators, including valid empty input', () => {
    withTempRepo((dir) => {
      for (const file of ['argv.txt', 'café.txt', 'nul.txt', 'last.txt']) {
        writeFileSync(join(dir, file), 'Clean synthetic content.\n', 'utf8');
      }
      const result = spawnSync(process.execPath, [guardScript, '--json', 'argv.txt'], {
        cwd: dir, input: 'café.txt\r\nnul.txt\0last.txt', encoding: 'utf8'
      });
      expect(result.status).toBe(0);
      expect(JSON.parse(result.stdout).scanned).toBe(4);
      const empty = runGuard(dir, [], ['--json']);
      expect(empty.status).toBe(0);
      expect(JSON.parse(empty.stdout).scanned).toBe(0);
      expect(JSON.parse(empty.stdout).error).toBeUndefined();
    });
  });

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
      linkOrCopy(guardScript, join(dir, 'scripts/check-no-institutional-leak.mjs'));
      linkOrCopy(denylistFile, join(dir, 'scripts/leak-guard-denylist.json'));
      linkOrCopy(stagedGuardScript, join(dir, 'scripts/check-staged-leak-guard.sh'));
      const sentinel = 'PRIVATE_STAGED_SENTINEL';
      const privateDenylist = writePrivateDenylist(dir, sentinel);

      expect(spawnSync('git', ['init'], { cwd: dir, encoding: 'utf8' }).status).toBe(0);
      const fixture = join(dir, 'fixture.txt');
      writeFileSync(fixture, 'clean\n', 'utf8');
      expect(spawnSync('git', ['add', 'fixture.txt'], { cwd: dir, encoding: 'utf8' }).status).toBe(0);
      writeFileSync(fixture, `${sentinel}\n`, 'utf8');
      expect(spawnSync('git', ['add', 'fixture.txt'], { cwd: dir, encoding: 'utf8' }).status).toBe(0);
      writeFileSync(fixture, 'clean\n', 'utf8');

      const result = spawnSync(shCmd, ['scripts/check-staged-leak-guard.sh'], {
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
      linkOrCopy(guardScript, join(dir, 'scripts/check-no-institutional-leak.mjs'));
      linkOrCopy(denylistFile, join(dir, 'scripts/leak-guard-denylist.json'));
      linkOrCopy(stagedGuardScript, join(dir, 'scripts/check-staged-leak-guard.sh'));
      const sentinel = 'PRIVATE_LOCAL_STAGED_SENTINEL';
      writePrivateDenylistFile(join(dir, 'scripts/leak-guard-denylist.local.json'), sentinel);

      expect(spawnSync('git', ['init'], { cwd: dir, encoding: 'utf8' }).status).toBe(0);
      writeFileSync(join(dir, 'fixture.txt'), `${sentinel}\n`, 'utf8');
      expect(spawnSync('git', ['add', 'fixture.txt'], { cwd: dir, encoding: 'utf8' }).status).toBe(0);

      const result = spawnSync(shCmd, ['scripts/check-staged-leak-guard.sh'], {
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
      linkOrCopy(guardScript, join(dir, 'scripts/check-no-institutional-leak.mjs'));
      linkOrCopy(denylistFile, join(dir, 'scripts/leak-guard-denylist.json'));
      linkOrCopy(stagedGuardScript, join(dir, 'scripts/check-staged-leak-guard.sh'));

      expect(spawnSync('git', ['init'], { cwd: dir, encoding: 'utf8' }).status).toBe(0);
      writeFileSync(join(dir, 'scripts/leak-guard-denylist.local.json'), '{"literalDenylist":["PRIVATE"]}\n', 'utf8');
      expect(spawnSync('git', ['add', 'scripts/leak-guard-denylist.local.json'], { cwd: dir, encoding: 'utf8' }).status).toBe(0);

      const result = spawnSync(shCmd, ['scripts/check-staged-leak-guard.sh'], {
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
      linkOrCopy(guardScript, join(dir, 'scripts/check-no-institutional-leak.mjs'));
      linkOrCopy(denylistFile, join(dir, 'scripts/leak-guard-denylist.json'));
      linkOrCopy(stagedGuardScript, join(dir, 'scripts/check-staged-leak-guard.sh'));

      expect(spawnSync('git', ['init'], { cwd: dir, encoding: 'utf8' }).status).toBe(0);
      writeFileSync(join(dir, 'fixture.txt'), 'clean\n', 'utf8');
      expect(spawnSync('git', ['add', 'fixture.txt'], { cwd: dir, encoding: 'utf8' }).status).toBe(0);

      const result = spawnSync(shCmd, ['scripts/check-staged-leak-guard.sh'], {
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
      linkOrCopy(guardScript, join(dir, 'scripts/check-no-institutional-leak.mjs'));
      linkOrCopy(denylistFile, join(dir, 'scripts/leak-guard-denylist.json'));
      linkOrCopy(stagedGuardScript, join(dir, 'scripts/check-staged-leak-guard.sh'));
      writeFileSync(join(dir, 'scripts/leak-guard-denylist.local.json'), '{}\n', 'utf8');

      expect(spawnSync('git', ['init'], { cwd: dir, encoding: 'utf8' }).status).toBe(0);
      writeFileSync(join(dir, 'fixture.txt'), 'clean\n', 'utf8');
      expect(spawnSync('git', ['add', 'fixture.txt'], { cwd: dir, encoding: 'utf8' }).status).toBe(0);

      const result = spawnSync(shCmd, ['scripts/check-staged-leak-guard.sh'], {
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
