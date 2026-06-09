import { chromium } from 'playwright';
import { spawn } from 'child_process';
import process from 'process';

const PORT = 4175;
const LOCAL_URL = `http://127.0.0.1:${PORT}/`;

async function main() {
  console.log('Starting local web server...');
  const server = spawn('python', ['-m', 'http.server', String(PORT)], {
    stdio: 'ignore',
    detached: false
  });

  await new Promise(r => setTimeout(r, 1000));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));

  try {
    console.log(`Navigating to ${LOCAL_URL}...`);
    await page.goto(LOCAL_URL);
    await page.waitForSelector('nav', { timeout: 5000 });

    console.log('Finding Education tab...');
    const educationTab = page.locator('button, a, span').filter({ hasText: /Education/i }).first();
    await educationTab.click();
    await new Promise(r => setTimeout(r, 1000));

    console.log('Finding Cervical Artery Dissection module...');
    const cervicalSectionBtn = page.locator('article, h2').filter({ hasText: /Cervical Artery Dissection/i }).first();
    await cervicalSectionBtn.click();
    await new Promise(r => setTimeout(r, 2000));

    console.log('Taking screenshot of local web page...');
    const screenshotPath = 'C:/Users/rkala/.gemini/antigravity/brain/9687f33e-77a0-4b59-b766-3f9e1dbeebd5/local_web_page_screenshot.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('Saved local web page screenshot to:', screenshotPath);

  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await browser.close();
    server.kill();
    console.log('Server stopped.');
  }
}

main().catch(console.error);
