import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  
  // Create context with service workers blocked to bypass PWA cache
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1200 },
    serviceWorkers: 'block'
  });
  const page = await context.newPage();
  
  // Disable HTTP cache
  await page.route('**/*', async (route) => {
    const headers = route.request().headers();
    headers['Pragma'] = 'no-cache';
    headers['Cache-Control'] = 'no-cache';
    await route.continue({ headers });
  });
  
  console.log('Navigating to live URL...');
  await page.goto('https://rkalani1.github.io/stroke/?cb=' + Date.now(), { waitUntil: 'networkidle' });
  
  console.log('Clicking on Educational Resources tab...');
  const educationTab = page.locator('button.tab-pill:has-text("Educational Resources")').first();
  await educationTab.click();
  await page.waitForTimeout(1000);
  
  console.log('Clicking on Cervical Artery Dissection card...');
  const card = page.locator('article:has(h2:has-text("Cervical Artery Dissection"))').first();
  await card.click();
  await page.waitForTimeout(2000);
  
  // Take screenshot of the page
  const screenshotPath = 'C:/Users/rkala/.gemini/antigravity/brain/9687f33e-77a0-4b59-b766-3f9e1dbeebd5/web_page_screenshot.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Saved web page screenshot to:', screenshotPath);
  
  await browser.close();
}

main().catch(console.error);
