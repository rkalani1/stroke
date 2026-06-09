import { chromium } from 'playwright';
import path from 'path';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set viewport to standard Letter size at 96 DPI: 8.5in x 11in = 816px x 1056px
  await page.setViewportSize({ width: 816, height: 1056 });
  
  const htmlPath = path.resolve('scratch/cervical_preview.html');
  await page.goto(`file://${htmlPath}`);
  await page.waitForTimeout(1000);
  
  const screenshotPath = 'C:/Users/rkala/.gemini/antigravity/brain/9687f33e-77a0-4b59-b766-3f9e1dbeebd5/live-pdf-preview.png';
  await page.screenshot({ path: screenshotPath });
  console.log('Saved screenshot to:', screenshotPath);
  
  await browser.close();
}

main().catch(console.error);
