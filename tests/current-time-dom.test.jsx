import { beforeAll, beforeEach, afterEach, afterAll, it, expect } from 'vitest';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

let browser, page, script;
const start = Date.parse('2026-10-01T12:00:00Z');
beforeAll(async () => {
  const result = await build({ bundle: true, write: false, format: 'iife', platform: 'browser', stdin: {
    resolveDir: fileURLToPath(new URL('../', import.meta.url)), loader: 'jsx', contents: `
      import React from 'react';
      import { createRoot } from 'react-dom/client';
      import { flushSync } from 'react-dom';
      import { useCurrentTime } from './src/use-current-time.js';
      function Clock({ active }) {
        const [now] = useCurrentTime(active);
        return <output>{now}</output>;
      }
      const root = createRoot(document.getElementById('root'));
      window.renderClock = active => flushSync(() => root.render(<Clock active={active} />));
    `,
  } });
  script = result.outputFiles[0].text;
  browser = await chromium.launch();
});
beforeEach(async () => {
  page = await browser.newPage();
  await page.clock.install({ time: new Date(start - 1000) });
  await page.clock.pauseAt(new Date(start));
  await page.setContent('<div id="root"></div>');
  await page.evaluate(() => {
    window.clockTicks = 0;
    const interval = window.setInterval;
    window.setInterval = (fn, ms) => interval(() => { window.clockTicks++; fn(); }, ms);
    window.hidden = false;
    Object.defineProperty(document, 'hidden', { get: () => window.hidden });
  });
  await page.addScriptTag({ content: script });
});
afterEach(async () => { await page?.close(); });
afterAll(async () => { await browser?.close(); });
const value = async () => Number(await page.locator('output').textContent());

it('does no periodic work while inactive and refreshes from wall time on pageshow', async () => {
  await page.evaluate(() => window.renderClock(false));
  await page.clock.fastForward(60000);
  expect(await page.evaluate(() => window.clockTicks)).toBe(0);
  expect(await value()).toBe(start);
  await page.evaluate(() => window.dispatchEvent(new Event('pageshow')));
  expect(await value()).toBe(start + 60000);
});

it('pauses while hidden and recomputes actual elapsed time after a long suspension', async () => {
  await page.evaluate(() => window.renderClock(true));
  await page.clock.runFor(3000);
  expect(await value()).toBe(start + 3000);
  await page.evaluate(() => { window.hidden = true; document.dispatchEvent(new Event('visibilitychange')); });
  const ticks = await page.evaluate(() => window.clockTicks);
  await page.clock.fastForward(7200000);
  expect(await page.evaluate(() => window.clockTicks)).toBe(ticks);
  await page.evaluate(() => { window.hidden = false; document.dispatchEvent(new Event('visibilitychange')); });
  expect(await value()).toBe(start + 7203000);
  await page.clock.runFor(1000);
  expect(await value()).toBe(start + 7204000);
  expect(await page.evaluate(() => window.clockTicks)).toBe(ticks + 1);
});

it('cleans up intervals when switching away and starts only one on return', async () => {
  await page.evaluate(() => window.renderClock(true));
  await page.clock.runFor(1000);
  await page.evaluate(() => window.renderClock(false));
  const ticks = await page.evaluate(() => window.clockTicks);
  await page.clock.fastForward(10000);
  expect(await page.evaluate(() => window.clockTicks)).toBe(ticks);
  await page.evaluate(() => window.renderClock(true));
  expect(await value()).toBe(start + 11000);
  await page.clock.runFor(1000);
  expect(await page.evaluate(() => window.clockTicks)).toBe(ticks + 1);
});
