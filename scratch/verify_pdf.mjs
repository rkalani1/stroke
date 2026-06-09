import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

async function testPdf(page, cardTitle, iframeTitle, screenshotName) {
  console.log(`\n--- Testing PDF: ${cardTitle} ---`);
  
  // Go back to dashboard if we are in a sub-module
  const backButton = page.locator('button:has-text("Back to Educational Resources")').first();
  if (await backButton.count() > 0) {
    console.log('Going back to dashboard...');
    await backButton.click();
    await page.waitForTimeout(1000);
  }

  // Click on the article card
  console.log(`Clicking on card: ${cardTitle}...`);
  const card = page.locator(`article:has(h2:has-text("${cardTitle}"))`).first();
  await card.scrollIntoViewIfNeeded();
  await card.click();
  await page.waitForTimeout(1000);

  // Click on "Preview PDF"
  console.log('Clicking on Preview PDF button...');
  const previewButton = page.locator('button:has-text("Preview PDF")').first();
  await previewButton.scrollIntoViewIfNeeded();
  await previewButton.click();
  await page.waitForTimeout(1000);

  // Wait for the iframe
  console.log('Waiting for the PDF iframe to render...');
  const iframe = page.locator(`iframe[title*="${iframeTitle}"]`).first();
  await iframe.waitFor({ state: 'visible', timeout: 10000 });
  const src = await iframe.getAttribute('src');
  console.log('PDF iframe src:', src);

  // Wait a bit for loading
  await page.waitForTimeout(5000);

  // Take screenshot
  const screenshotPath = path.join(process.cwd(), 'output', 'playwright', screenshotName);
  await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
  await page.screenshot({ path: screenshotPath });
  console.log('Saved screenshot to:', screenshotPath);
}

async function main() {
  console.log('Starting verification of the live site...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1000 }
  });
  const page = await context.newPage();

  // Capture request failures
  page.on('requestfailed', req => {
    console.log('Request Failed:', req.url(), req.failure()?.errorText);
  });

  try {
    // Navigate to the live app
    console.log('Navigating to live URL...');
    await page.goto('https://rkalani1.github.io/stroke/', { waitUntil: 'networkidle', timeout: 60000 });
    console.log('Navigation successful.');

    // Click on the Educational Resources tab
    console.log('Clicking on Educational Resources tab...');
    const educationTab = page.locator('button.tab-pill:has-text("Educational Resources")').first();
    await educationTab.click();
    await page.waitForTimeout(1000);

    // Test TOAST PDF
    await testPdf(page, 'TOAST Stroke Classification', 'Stroke Classification', 'toast-pdf-preview.png');

    // Test Cervical Artery Dissection PDF
    await testPdf(page, 'Cervical Artery Dissection', 'Cervical Artery Dissection', 'cad-pdf-preview.png');

    console.log('\nBoth tests finished.');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

main();
