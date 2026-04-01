import { test } from 'node:test';
import assert from 'node:assert';
import { safeParseDt, ensureArray, toIsoString, safeFormatTime } from './utils.mjs';

test('safeParseDt', async (t) => {
  await t.test('returns null for falsy values', () => {
    assert.strictEqual(safeParseDt(null), null);
    assert.strictEqual(safeParseDt(undefined), null);
    assert.strictEqual(safeParseDt(''), null);
  });

  await t.test('returns Date object for valid date strings', () => {
    const dateStr = '2023-10-27T10:00:00Z';
    const result = safeParseDt(dateStr);
    assert.ok(result instanceof Date);
    // toISOString() usually includes milliseconds
    assert.strictEqual(result.toISOString(), new Date(dateStr).toISOString());
  });

  await t.test('returns Date object for valid Date objects', () => {
    const date = new Date('2023-10-27T10:00:00Z');
    const result = safeParseDt(date);
    assert.ok(result instanceof Date);
    assert.strictEqual(result.getTime(), date.getTime());
  });

  await t.test('returns null for invalid date strings', () => {
    assert.strictEqual(safeParseDt('not-a-date'), null);
    assert.strictEqual(safeParseDt('2023-13-45'), null);
  });

  await t.test('returns Date object for numeric timestamps', () => {
    const timestamp = 1698393600000; // 2023-10-27T08:00:00.000Z
    const result = safeParseDt(timestamp);
    assert.ok(result instanceof Date);
    assert.strictEqual(result.getTime(), timestamp);
  });
});

test('ensureArray', async (t) => {
  await t.test('returns the same array if input is an array', () => {
    const input = [1, 2, 3];
    assert.strictEqual(ensureArray(input), input);
  });

  await t.test('returns fallback if input is not an array', () => {
    assert.deepStrictEqual(ensureArray(null, [1]), [1]);
    assert.deepStrictEqual(ensureArray('not-array', []), []);
    assert.deepStrictEqual(ensureArray(undefined), []);
  });
});

test('toIsoString', async (t) => {
  await t.test('returns ISO string for valid date', () => {
    const date = '2023-10-27T10:00:00Z';
    assert.strictEqual(toIsoString(date), new Date(date).toISOString());
  });

  await t.test('returns current time ISO string for invalid date', () => {
    const result = toIsoString('invalid');
    assert.doesNotThrow(() => new Date(result).toISOString());
  });
});

test('safeFormatTime', async (t) => {
  await t.test('formats valid date string correctly', () => {
    const dateStr = '2023-10-27T10:30:00';
    const result = safeFormatTime(dateStr);
    // Format depends on environment locale, but for en-US it should be something like "10:30 AM"
    assert.match(result, /^(0?[1-9]|1[0-2]):[0-5][0-9]\s(AM|PM)$/);
  });

  await t.test('returns null for invalid input', () => {
    assert.strictEqual(safeFormatTime(null), null);
    assert.strictEqual(safeFormatTime('invalid'), null);
  });
});
