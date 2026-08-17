import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generatedFileIsCurrent } from '../scripts/generate-agent-assets.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const generatorPath = path.join(repoRoot, 'scripts', 'generate-agent-assets.mjs');

describe('agent asset byte synchronization', () => {
  it('distinguishes exact bytes from stale and missing generated files', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stroke-agent-assets-'));
    const generatedPath = path.join(tempDir, 'generated.txt');
    try {
      fs.writeFileSync(generatedPath, 'exact\n', 'utf8');
      expect(await generatedFileIsCurrent(generatedPath, 'exact\n')).toBe(true);
      expect(await generatedFileIsCurrent(generatedPath, 'stale\n')).toBe(false);
      expect(await generatedFileIsCurrent(path.join(tempDir, 'missing.txt'), '')).toBe(false);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('fails --check closed when institutional protocol generation cannot load', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stroke-agent-assets-cli-'));
    try {
      fs.mkdirSync(path.join(tempDir, 'content', 'calculators'), { recursive: true });
      fs.mkdirSync(path.join(tempDir, 'src', 'evidence'), { recursive: true });
      fs.mkdirSync(path.join(tempDir, 'src', 'guidelines'), { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ type: 'module', version: '0.0.0' }));
      fs.writeFileSync(path.join(tempDir, 'content', 'calculators', 'registry.json'), '[]\n');
      fs.writeFileSync(path.join(tempDir, 'src', 'evidence', 'index.js'), [
        'export const completedTrials = [];',
        'export const activeTrials = [];',
        'export const recommendations = [];',
        'export const citations = [];',
        'export const claims = [];',
        'export const topics = [];',
        'export const VERIFICATION_STATUS_LABELS = {};',
        'export const CERTAINTY_LABELS = {};',
        'export const EVIDENCE_TYPE_LABELS = {};',
        'export const ACTIVE_STATUS_LABELS = {};',
      ].join('\n'));
      fs.writeFileSync(path.join(tempDir, 'src', 'management-guidance.js'), [
        "export const AIS_COMMAND_CENTER_LAST_REVIEWED = '';",
        'export const AIS_SOURCE_LINKS = [];',
        'export const AIS_COMMAND_CENTER_CARDS = [];',
      ].join('\n'));
      fs.writeFileSync(path.join(tempDir, 'src', 'institutional-protocols.js'), "throw new Error('fixture import failure');\n");

      const result = spawnSync(process.execPath, [generatorPath, '--check'], {
        cwd: tempDir,
        encoding: 'utf8',
      });

      expect(result.status).toBe(1);
      expect(result.stderr).toContain('fixture import failure');
      expect(result.stdout).not.toContain('check OK');
      expect(result.stderr).not.toContain('skipped generic-protocols');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
