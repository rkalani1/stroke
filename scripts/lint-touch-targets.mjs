#!/usr/bin/env node
/**
 * v7.0 — lint:touch-targets.
 * Drop-in: scripts/lint-touch-targets.mjs
 *
 * Walks the live DOM via Playwright at three mobile viewports (320/375/768)
 * across three hash routes (#/encounter, #/management, #/trials) and asserts
 * that every interactive element has getBoundingClientRect() ≥ 44 × 44.
 *
 * Interactive = button, [role=button], a[href], input:not(hidden), select,
 *               textarea, [tabindex]:not([tabindex="-1"]), summary, label[for].
 *
 * Whitelist: elements with data-skip-tap (escape hatch for genuinely fine-
 * grained controls like canvas-overlay handles).
 *
 * Run with: node scripts/lint-touch-targets.mjs [--url URL] [--browsers chromium]
 * Default URL: http://localhost:8080
 */

import { chromium } from 'playwright';
import { exit } from 'node:process';

const URL = process.env.LINT_URL || process.argv[2] || 'http://localhost:8080';
const ROUTES = ['/#/encounter', '/#/management', '/#/trials'];
const VIEWPORTS = [
  { name: '320', width: 320, height: 568 },
  { name: '375', width: 375, height: 812 },
  { name: '768', width: 768, height: 1024 }
];
const MIN = 44;

const offenders = [];

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

for (const route of ROUTES) {
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(URL + route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const found = await page.evaluate((min) => {
      const SEL = [
        'button', '[role="button"]', 'a[href]',
        'input:not([type="hidden"])', 'select', 'textarea',
        '[tabindex]:not([tabindex="-1"])', 'summary', 'label[for]'
      ].join(',');
      const bad = [];
      document.querySelectorAll(SEL).forEach(el => {
        if (el.hasAttribute('data-skip-tap')) return;
        // Skip elements hidden via display:none or visibility:hidden
        const cs = window.getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return;
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return; // off-screen
        if (r.width < min || r.height < min) {
          bad.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            label: el.getAttribute('aria-label') || (el.textContent || '').trim().slice(0, 40),
            w: Math.round(r.width), h: Math.round(r.height)
          });
        }
      });
      return bad;
    }, MIN);

    for (const b of found) {
      offenders.push({ ...b, route, viewport: vp.name });
    }
  }
}

await browser.close();

if (offenders.length === 0) {
  console.log(`✓ lint:touch-targets — clean (${ROUTES.length * VIEWPORTS.length} viewport·route combos checked)`);
  exit(0);
}

console.error(`✕ lint:touch-targets — ${offenders.length} small target(s) <${MIN}×${MIN}:`);
for (const o of offenders.slice(0, 100)) {
  console.error(`  [${o.viewport} ${o.route}] <${o.tag}> "${o.label}" — ${o.w}×${o.h}`);
}
if (offenders.length > 100) console.error(`  …and ${offenders.length - 100} more`);
exit(1);
