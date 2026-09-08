// Smoke-check real service-worker installation and offline reload with synthetic data only.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const base = process.env.STROKE_REVIEW_URL || 'http://127.0.0.1:4186/';
const browser = await chromium.launch(process.env.STROKE_CHROMIUM_PATH
  ? { executablePath: process.env.STROKE_CHROMIUM_PATH } : {});
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(base + '?publicDemo=1#/research/calculators', { waitUntil: 'networkidle' });
  await page.evaluate(() => Promise.race([
    navigator.serviceWorker.ready,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Service worker did not become ready')), 15000))
  ]).then(() => true));
  await page.reload({ waitUntil: 'networkidle' });
  const caches = await page.evaluate(() => window.caches.keys());
  assert.ok(caches.some(key => key.startsWith('stroke-cache-')), 'App cache installed');
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#research-tabpanel-calculators').waitFor();
  assert.ok(await page.getByText('Quick Dosing Reference', { exact: true }).count());
  await page.getByRole('tab', { name: 'Trials', exact: true }).click();
  await page.getByRole('button', { name: /Ischemic/ }).first().waitFor();
  console.log('PASS: fresh cache install, offline calculator reload and offline trial navigation', caches);
  await context.close();
} finally { await browser.close(); }
