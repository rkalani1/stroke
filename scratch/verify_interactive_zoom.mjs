import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  
  // Disable caching and block service workers to ensure we pull the fresh deployment
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1000 },
    serviceWorkers: 'block'
  });
  const page = await context.newPage();
  
  await page.route('**/*', async (route) => {
    const headers = route.request().headers();
    headers['Pragma'] = 'no-cache';
    headers['Cache-Control'] = 'no-cache';
    await route.continue({ headers });
  });

  try {
    const liveUrl = 'https://rkalani1.github.io/stroke/?cb=' + Date.now();
    console.log('Navigating to live URL:', liveUrl);
    await page.goto(liveUrl, { waitUntil: 'networkidle' });

    console.log('Clicking on Educational Resources tab...');
    const educationTab = page.locator('button.tab-pill:has-text("Educational Resources")').first();
    await educationTab.click();
    await page.waitForTimeout(1000);

    console.log('Clicking on ICP & Herniation Management card...');
    const icpCard = page.locator('article:has(h2:has-text("Intracranial Hypertension & Herniation"))').first();
    await icpCard.click();
    await page.waitForTimeout(2000);

    console.log('Taking screenshot of the page before zoom...');
    await page.screenshot({ path: 'C:/Users/rkala/.gemini/antigravity/brain/9687f33e-77a0-4b59-b766-3f9e1dbeebd5/live_page_before_zoom.png' });

    console.log('Finding and clicking on the brain herniation diagram image...');
    const diagramContainer = page.locator('img[alt="Brain Herniation Diagram"]').first();
    await diagramContainer.click({ force: true });
    await page.waitForTimeout(1500);

    console.log('Taking screenshot of the open lightbox modal...');
    const screenshotPath = 'C:/Users/rkala/.gemini/antigravity/brain/9687f33e-77a0-4b59-b766-3f9e1dbeebd5/live_lightbox_zoom_active.png';
    await page.screenshot({ path: screenshotPath });
    console.log('Saved zoom active screenshot to:', screenshotPath);

  } catch (err) {
    console.error('Verification failed:', err);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
