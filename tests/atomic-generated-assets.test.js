import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { atomicWriteFile } from '../scripts/atomic-write.mjs';

describe('atomic generated assets', () => {
  it('keeps existing JSON complete while concurrent writers replace it', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'stroke-atomic-'));
    const destination = path.join(directory, 'data.json');
    const versions = Array.from({ length: 33 }, (_, version) => JSON.stringify({ version, payload: String(version).repeat(65536) }));
    try {
      await fs.writeFile(destination, versions[0]);
      const readers = Array.from({ length: 4 }, async () => {
        for (let i = 0; i < 80; i++) {
          const observed = await fs.readFile(destination, 'utf8');
          expect(() => JSON.parse(observed)).not.toThrow();
          expect(versions).toContain(observed);
        }
      });
      await Promise.all([...readers, ...versions.slice(1).map(content => atomicWriteFile(destination, content))]);
      expect(versions.slice(1)).toContain(await fs.readFile(destination, 'utf8'));
      expect(await fs.readdir(directory)).toEqual(['data.json']);
    } finally {
      await fs.rm(directory, { recursive: true, force: true });
    }
  });

  it('creates parent directories and preserves exact UTF-8 bytes', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'stroke-atomic-'));
    try {
      const destination = path.join(directory, 'nested', 'data.json');
      const content = '{"nativeStrength":"≤ — ≥"}\n';
      await atomicWriteFile(destination, content);
      expect(await fs.readFile(destination, 'utf8')).toBe(content);
    } finally {
      await fs.rm(directory, { recursive: true, force: true });
    }
  });

  it('propagates replacement failure and cleans the incomplete publication', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'stroke-atomic-'));
    const destination = path.join(directory, 'occupied');
    try {
      await fs.mkdir(destination);
      await fs.writeFile(path.join(destination, 'preserved'), 'original');
      await expect(atomicWriteFile(destination, '{"replacement":true}')).rejects.toThrow();
      expect(await fs.readdir(directory)).toEqual(['occupied']);
      expect(await fs.readFile(path.join(destination, 'preserved'), 'utf8')).toBe('original');
    } finally {
      await fs.rm(directory, { recursive: true, force: true });
    }
  });
});
