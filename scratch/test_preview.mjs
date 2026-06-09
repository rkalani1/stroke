import { chromium } from 'playwright';
import { spawn } from 'child_process';
import process from 'process';

const PORT = 4174;
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

  // Monitor network requests and responses
  page.on('request', request => {
    console.log(`REQ: ${request.method()} ${request.url()}`);
  });
  
  page.on('response', response => {
    const status = response.status();
    const url = response.url();
    if (url.includes('.pdf')) {
      console.log(`RESP: ${status} ${url} | type: ${response.headers()['content-type'] || 'unknown'} | size: ${response.headers()['content-length'] || 'unknown'}`);
    }
  });

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));

  try {
    console.log(`Navigating to ${LOCAL_URL}...`);
    await page.goto(LOCAL_URL);
    await page.waitForSelector('nav', { timeout: 5000 });

    console.log('Finding Education tab...');
    // The education tab button in app.jsx might be button or link. Let's find it.
    const educationTab = page.locator('button, a, span').filter({ hasText: /Education/i }).first();
    await educationTab.click();
    await new Promise(r => setTimeout(r, 1000));

    console.log('Finding Cervical Artery Dissection module...');
    // The module is in an article or has h2 with text
    const cervicalSectionBtn = page.locator('article, h2').filter({ hasText: /Cervical Artery Dissection/i }).first();
    await cervicalSectionBtn.click();
    await new Promise(r => setTimeout(r, 1000));

    console.log('Finding and clicking "Preview PDF" for Cervical Artery Dissection...');
    // Click preview button
    const previewBtn = page.locator('button').filter({ hasText: /Preview PDF/i }).first();
    await previewBtn.click();
    await new Promise(r => setTimeout(r, 3000));

    console.log('Taking screenshot...');
    await page.screenshot({ path: 'scratch/pdf-preview-cervical.png' });
    console.log('Screenshot saved to scratch/pdf-preview-cervical.png');

  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await browser.close();
    server.kill();
    console.log('Server stopped.');
  }
}

main().catch(console.error);
