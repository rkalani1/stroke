// Read-only browser checks for the September 2026 non-Protocol review.
// Run against a served build: STROKE_REVIEW_URL defaults to localhost:4186.
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
const base = process.env.STROKE_REVIEW_URL || 'http://127.0.0.1:4186/';
const output = process.env.STROKE_REVIEW_OUTPUT || '../responsive-review';
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch(process.env.STROKE_CHROMIUM_PATH
  ? { executablePath: process.env.STROKE_CHROMIUM_PATH } : {});
const routes = ['encounter', 'trials', 'trials/tables', 'trials/database',
  'research/guidelines', 'research/references', 'research/calculators',
  'research/education', 'research/education/simulators'];
const report = [];
try {
  for (const width of [320, 390, 768, 1440]) {
    for (const colorScheme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport: { width, height: 900 },
        colorScheme, isMobile: width < 768, hasTouch: width < 768, serviceWorkers: 'block' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      for (const route of routes) {
        await page.goto(base + '?publicDemo=1#/' + route, { waitUntil: 'networkidle' });
        await page.waitForSelector('button.tab-pill', { state: 'attached' });
        const metrics = await page.evaluate(() => {
          const visible = x => x.checkVisibility({ checkVisibilityCSS: true }) && x.getBoundingClientRect().width > 0 && x.getBoundingClientRect().height > 0;
          return {
            viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth,
            darkClass: document.documentElement.classList.contains('dark'),
            bodyLength: document.body.innerText.length,
            firstEncounterInputTop: document.querySelector('#input-caller-name')?.getBoundingClientRect().top ?? null,
            selectedTab: document.querySelector('button.tab-pill.active')?.innerText,
            unnamedControls: [...document.querySelectorAll('button, input:not([type=hidden]), select, textarea')]
              .filter(visible).filter(x => !x.getAttribute('aria-label') && !x.getAttribute('aria-labelledby') &&
                !x.labels?.length && !x.innerText.trim() && !x.getAttribute('title') && !x.getAttribute('placeholder'))
              .map(x => ({ tag: x.tagName, id: x.id, type: x.type })),
            overflowElements: [...document.querySelectorAll('main *, [role=tabpanel] *')].filter(visible)
              .filter(x => { const r = x.getBoundingClientRect(); return r.left < -1 || r.right > innerWidth + 1; })
              .slice(0, 8).map(x => ({ tag: x.tagName, id: x.id, text: x.innerText.slice(0, 70) }))
          };
        });
        report.push({ width, colorScheme, route, ...metrics, errors: [...errors] });
        if (width === 390 && colorScheme === 'light' && ['encounter', 'trials', 'research/guidelines'].includes(route)) {
          await page.screenshot({ path: output + '/' + route.replaceAll('/', '-') + '.png' });
        }
      }
      await context.close();
    }
  }
} finally { await browser.close(); }
await fs.writeFile(output + '/responsive-report.json', JSON.stringify(report, null, 2) + '\n');
const failures = report.filter(r => r.scrollWidth > r.viewport + 1 || r.errors.length || r.bodyLength < 100);
console.log(JSON.stringify({ checked: report.length, failures, unnamed: report.filter(r => r.unnamedControls.length),
  encounter: report.filter(r => r.route === 'encounter').map(r => ({width:r.width, mode:r.colorScheme, firstInput:r.firstEncounterInputTop})) }, null, 2));
if (failures.length) process.exitCode = 1;
