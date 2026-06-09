import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';

const PORT = 4176;
const LOCAL_URL = `http://127.0.0.1:${PORT}/`;

async function main() {
  console.log('Starting local web server...');
  const server = spawn('python', ['-m', 'http.server', String(PORT)], {
    stdio: 'ignore'
  });

  await new Promise(r => setTimeout(r, 1500));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 950 });

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));

  try {
    console.log(`Navigating to ${LOCAL_URL}...`);
    await page.goto(LOCAL_URL);
    await page.waitForSelector('button.tab-pill', { timeout: 5000 });

    console.log('Clicking on Educational Resources tab...');
    const educationTab = page.locator('button.tab-pill:has-text("Educational Resources")').first();
    await educationTab.click();
    await page.waitForTimeout(1000);

    console.log('Clicking on ICP & Herniation Management card...');
    const icpCard = page.locator('article:has(h2:has-text("Intracranial Hypertension & Herniation"))').first();
    await icpCard.click();
    await page.waitForTimeout(1000);

    console.log('Taking screenshot of the page before zoom...');
    await page.screenshot({ path: 'C:/Users/rkala/.gemini/antigravity/brain/9687f33e-77a0-4b59-b766-3f9e1dbeebd5/local_page_before_zoom.png' });

    console.log('Finding and clicking on the brain herniation diagram image...');
    const diagramContainer = page.locator('img[alt="Brain Herniation Diagram"]').first();
    await diagramContainer.click({ force: true });
    await page.waitForTimeout(1000);

    console.log('Taking screenshot of the local lightbox modal...');
    const screenshotPath = 'C:/Users/rkala/.gemini/antigravity/brain/9687f33e-77a0-4b59-b766-3f9e1dbeebd5/local_lightbox_zoom_active.png';
    await page.screenshot({ path: screenshotPath });
    console.log('Saved local zoom active screenshot to:', screenshotPath);

  } catch (err) {
    console.error('Local test failed:', err);
  } finally {
    await browser.close();
    server.kill();
    console.log('Server stopped.');
  }
}

main().catch(console.error);
