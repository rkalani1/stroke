import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { computeLock, diffLock, LOCK_FILE, LOCKED_FILES } from '../scripts/protocols-source-lock.mjs';

// Protocols content is frozen. These hashes cover the Protocols-owned sources,
// the shared data the tab reads, and shared-function outputs over fixed inputs.
// A presentation change elsewhere must leave every entry unchanged.
describe('Protocols tab source lock', () => {
  it('matches the recorded hashes exactly', async () => {
    const expected = JSON.parse(readFileSync(LOCK_FILE, 'utf8'));
    const actual = await computeLock();
    expect(diffLock(expected, actual)).toEqual([]);
  }, 30000);

  it('locks every Protocols-owned source and both rendered baselines', () => {
    const expected = JSON.parse(readFileSync(LOCK_FILE, 'utf8'));
    expect(Object.keys(expected.files).sort()).toEqual([...LOCKED_FILES].sort());
    expect(Object.keys(expected.behavior).length).toBeGreaterThanOrEqual(6);
  });
});
