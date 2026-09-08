// Check complete guideline rendering and the real offline application bundle.
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base = process.env.STROKE_REVIEW_URL || 'http://127.0.0.1:4186/';
const output = process.env.STROKE_REVIEW_OUTPUT || '../complete-guidelines/browser';
await fs.mkdir(output, { recursive: true });
const guidelines = [];
for (const file of await fs.readdir('src/guidelines')) {
  if (!file.endsWith('.json')) continue;
  const guideline = JSON.parse(await fs.readFile('src/guidelines/' + file, 'utf8'));
  if (guideline.coverage?.status === 'complete' && (!process.env.STROKE_REVIEW_GUIDELINE || guideline.id === process.env.STROKE_REVIEW_GUIDELINE)) guidelines.push(guideline);
}
const browser = await chromium.launch(process.env.STROKE_CHROMIUM_PATH ? { executablePath: process.env.STROKE_CHROMIUM_PATH } : {});
const report = [];
try {
  for (const width of [320, 390, 768, 1440]) for (const colorScheme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme, serviceWorkers: 'block' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '?publicDemo=1#/research/guidelines', { waitUntil: 'networkidle' });
    assert.equal(await page.locator('#guideline-library-heading').innerText(), 'Guidelines');
    for (const guideline of guidelines) {
      await page.getByLabel('Filter by guideline', { exact: true }).selectOption(guideline.id);
      await page.locator(`[id="gl-rec-${guideline.recommendations.at(-1).id}"]`).waitFor();
      assert.equal(await page.locator('[id^="gl-rec-"]').count(), guideline.recommendations.length, guideline.id);
      const metrics = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
        narrowRows: [...document.querySelectorAll('[id^="gl-rec-"] p.text-sm')].filter(p => p.getBoundingClientRect().width < 140).length }));
      const body = await page.locator('body').innerText();
      assert.ok(body.includes(`Complete recommendation coverage: ${guideline.coverage.sourceRecommendationCount} recommendations`), guideline.id);
      assert.ok(!body.includes('Selected extracts only.'), guideline.id);
      if (guideline.id === 'eso-visual-2025') assert.ok(body.includes('Newer evidence reviewed 2026-09-06'));
      report.push({ width, colorScheme, id: guideline.id, rows: guideline.recommendations.length, ...metrics, errors: [...errors] });
      assert.ok(metrics.scrollWidth <= width + 1, `${guideline.id}: horizontal overflow at ${width}`);
      assert.equal(metrics.narrowRows, 0, `${guideline.id}: unreadably narrow text`);
      if (width === 390 && colorScheme === 'light' && guideline.id === 'aha-dyslipidemia-2026') await page.screenshot({ path: output + '/guidelines-mobile.png' });
    }
    assert.equal(errors.length, 0, errors.join('\n'));
    await context.close();
    console.log(`PASS: ${guidelines.length} complete guidelines at ${width}px, ${colorScheme}`);
  }
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(base + '?publicDemo=1#/research/guidelines', { waitUntil: 'networkidle' });
  await page.evaluate(() => Promise.race([navigator.serviceWorker.ready, new Promise((_, reject) => setTimeout(() => reject(new Error('Service worker timeout')), 15000))]).then(() => true));
  await page.reload({ waitUntil: 'networkidle' });
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  for (const guideline of guidelines) {
    await page.getByLabel('Filter by guideline', { exact: true }).selectOption(guideline.id);
    await page.locator(`[id="gl-rec-${guideline.recommendations.at(-1).id}"]`).waitFor();
    assert.equal(await page.locator('[id^="gl-rec-"]').count(), guideline.recommendations.length, `Offline ${guideline.id}`);
  }
  await page.getByLabel('Filter by guideline', { exact: true }).selectOption('');
  await page.getByLabel('Search guideline recommendations').fill('TenCRAOS');
  await page.waitForTimeout(300);
  assert.ok(await page.locator('#gl-rec-eso-visual-2025-pico9-r1').count() > 0, 'Offline search includes newer source evidence');
  await context.close();
  console.log(`PASS: ${guidelines.length} complete guidelines and search after offline reload`);
} finally {
  await browser.close();
  await fs.writeFile(output + '/guideline-browser-report.json', JSON.stringify(report, null, 2) + '\n');
}
