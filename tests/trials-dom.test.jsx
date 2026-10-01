import { beforeAll, afterAll, beforeEach, afterEach, describe, it, expect } from 'vitest';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { buildTableHtml, buildTableMarkdown } from '../src/components/EligibilityTables.jsx';
import { eligibilityTables } from '../src/evidence/eligibilityTables.js';

let browser, page, script, css;
beforeAll(async () => {
  css = await readFile(new URL('../tailwind.css', import.meta.url), 'utf8');
  const result = await build({ bundle: true, write: false, format: 'iife', platform: 'browser', stdin: {
    resolveDir: fileURLToPath(new URL('../', import.meta.url)), loader: 'jsx', contents: `
      import React, { useState } from 'react';
      import { createRoot } from 'react-dom/client';
      import Trials from './src/Trials.jsx';
      function Harness() {
        const [sub,setSub] = useState('screener'), [active,setActive] = useState(true);
        window.setTrialsActive = setActive; window.setTrialsView = setSub;
        return <Trials sub={sub} onNavigate={setSub} active={active} />;
      }
      createRoot(document.getElementById('root')).render(<Harness />);
    `,
  } });
  script = result.outputFiles[0].text;
  browser = await chromium.launch();
});
beforeEach(async () => {
  page = await browser.newPage();
  page.setDefaultTimeout(10000);
  await page.setContent('<div id="root"></div>');
  await page.addStyleTag({ content: css });
  await page.evaluate(() => {
    window.copies = []; window.denyClipboard = false;
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => {
      if (window.denyClipboard) throw new Error('Denied');
      window.copies.push(text);
    } } });
  });
  await page.addScriptTag({ content: script });
  await page.getByRole('heading', { name: 'Trials', exact: true }).waitFor();
});
afterEach(async () => { await page?.close(); });
afterAll(async () => { await browser?.close(); });

describe('restored independent Trials workspace', () => {
  it('moves the selected tab and focus with arrows, Home and End', async () => {
    await page.getByRole('tab', { name: 'Screener', exact: true }).focus();
    for (const [key, label] of [['ArrowRight', 'Tables'], ['End', 'Completed evidence'], ['ArrowLeft', 'Database'], ['Home', 'Screener'], ['ArrowLeft', 'Completed evidence']]) {
      await page.keyboard.press(key);
      const selected = page.getByRole('tab', { name: label, exact: true });
      expect(await selected.getAttribute('aria-selected')).toBe('true');
      expect(await selected.evaluate(el => el === document.activeElement)).toBe(true);
      expect(await page.locator('[role="tab"][tabindex="0"]').count()).toBe(1);
    }
  });
  it('starts unknown, preserves two-tap screening across views, and resets to unknown', async () => {
    expect(await page.getByRole('button', { name: 'Copy screening briefing' }).count()).toBe(0);
    await page.getByRole('button', { name: 'Ischemic stroke', exact: true }).click();
    expect(await page.getByText('Onset not recorded; timing remains unknown.', { exact: false }).count()).toBe(1);
    expect(await page.getByRole('button', { name: '< 4.5h Hyperacute' }).getAttribute('aria-pressed')).toBe('false');
    await page.getByRole('button', { name: '< 4.5h Hyperacute' }).click();
    await page.getByRole('tab', { name: 'Tables', exact: true }).click();
    await page.getByRole('tab', { name: 'Screener', exact: true }).click();
    expect(await page.getByRole('button', { name: '< 4.5h Hyperacute' }).getAttribute('aria-pressed')).toBe('true');
    await page.getByRole('button', { name: 'Reset screen', exact: true }).click();
    expect(await page.getByRole('button', { name: 'Copy screening briefing' }).count()).toBe(0);
    expect(await page.getByRole('button', { name: 'Ischemic stroke', exact: true }).getAttribute('aria-pressed')).toBe('false');
  });

  it('retains dated source limits without removed visible framing', async () => {
    const body = await page.locator('body').innerText();
    expect(body).toContain('Screening does not determine treatment eligibility');
    expect(body).not.toMatch(/synthetic|public demo|\bPHI\b/i);
    await page.getByRole('tab', { name: 'Database', exact: true }).click();
    await page.getByRole('searchbox').fill('NCT06289985');
    expect(await page.locator('#trials-database-panel article').count()).toBe(1);
    const card = await page.locator('#trials-database-panel article').innerText();
    expect(card).toContain('Recorded registry check: 2026-10-01');
    expect(card).toContain('Local activation: not confirmed');
    await page.getByRole('button', { name: 'Full criteria & details', exact: true }).click();
    const text = await page.getByRole('dialog').innerText();
    expect(text).toContain('Inclusion criteria'); expect(text).toContain('Exclusion criteria');
    expect(text).toContain('Source gaps / confirmation required');
    expect(text).not.toMatch(/synthetic|public demo|\bPHI\b/i);
  });

  it('supports modal keyboard closure and removes portalled dialogs on leaving Trials', async () => {
    await page.getByRole('tab', { name: 'Database', exact: true }).click();
    await page.getByRole('searchbox').fill('STEP');
    const trigger = page.getByRole('button', { name: 'Full criteria & details', exact: true });
    await trigger.click();
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Close trial details');
    await page.keyboard.press('Escape');
    expect(await page.getByRole('dialog').count()).toBe(0);
    expect(await trigger.evaluate(el => el === document.activeElement)).toBe(true);
    await trigger.click(); await page.getByRole('dialog').waitFor();
    await page.evaluate(() => window.setTrialsActive(false));
    await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));
    await page.evaluate(() => window.setTrialsActive(true));
    expect(await page.getByRole('dialog').count()).toBe(0);
    expect(await page.getByRole('searchbox').inputValue()).toBe('STEP');
  });

  it('copies only on explicit action and offers a nonpersistent selected failure fallback', async () => {
    expect(await page.evaluate(() => window.copies.length)).toBe(0);
    await page.getByRole('button', { name: 'Ischemic stroke', exact: true }).click();
    await page.getByRole('button', { name: 'Copy screening briefing', exact: true }).click();
    await page.getByText('Trial screener briefing copied.', { exact: true }).waitFor();
    const copied = await page.evaluate(() => window.copies[0]);
    expect(copied).toContain('Classification: Ischemic stroke');
    expect(copied).toContain('Onset window: Not recorded');
    expect(copied).toContain('local activation: not confirmed');
    expect(copied).toBe(await page.locator('[aria-label="Screening briefing preview"]').textContent());
    await page.evaluate(() => { window.denyClipboard = true; });
    await page.getByRole('button', { name: 'Copy screening briefing', exact: true }).click();
    const fallback = page.getByRole('textbox', { name: 'Trial copy fallback', exact: true });
    await fallback.waitFor();
    expect(await fallback.evaluate(el => el.readOnly && el.selectionStart === 0 && el.selectionEnd === el.value.length)).toBe(true);
    await page.getByRole('button', { name: 'TIA', exact: true }).click();
    expect(await fallback.count()).toBe(0);
    await page.getByRole('tab', { name: 'Tables', exact: true }).click();
    await page.getByRole('button', { name: 'Copy as Markdown', exact: true }).first().click();
    await fallback.waitFor();
    expect(await fallback.inputValue()).toContain('STEP');
    await page.evaluate(() => window.setTrialsActive(false));
    await page.waitForFunction(() => !document.querySelector('[aria-label="Trial copy fallback"]'));
  });

  it('surfaces future windows and not-yet-enrolling studies separately from collapsed exclusions', async () => {
    await page.getByRole('button', { name: 'Ischemic stroke', exact: true }).click();
    await page.getByRole('button', { name: '< 4.5h Hyperacute' }).click();
    const future = page.getByRole('region', { name: 'Before study window', exact: true });
    const notYet = page.getByRole('region', { name: 'Not yet enrolling', exact: true });
    expect(await future.isVisible()).toBe(true);
    expect(await notYet.isVisible()).toBe(true);
    expect(await future.locator('article').count()).toBeGreaterThan(0);
    expect(await notYet.innerText()).toContain('CLARITY');
    const excluded = page.locator('#trials-screener-panel details').filter({ has: page.locator('summary', { hasText: /^Modeled criterion not met/ }) });
    const unverified = page.locator('#trials-screener-panel details').filter({ has: page.locator('summary', { hasText: /^Unverified profiles/ }) });
    expect(await excluded.getAttribute('open')).toBeNull();
    expect(await unverified.getAttribute('open')).toBeNull();
    await page.getByRole('button', { name: 'Copy screening briefing', exact: true }).click();
    const copied = await page.evaluate(() => window.copies[0]);
    expect(copied).toContain('BEFORE STUDY WINDOW');
    expect(copied).toContain('NOT YET ENROLLING');
    expect(copied).toBe(await page.locator('[aria-label="Screening briefing preview"]').textContent());
    await page.getByRole('button', { name: 'Clear onset to unknown', exact: true }).click();
    expect(await page.getByRole('region', { name: 'Before study window', exact: true }).count()).toBe(0);
    expect(await page.locator('[aria-label="Screening briefing preview"]').textContent()).toContain('Onset window: Not recorded');
  });

  it('combines independent database filters and restores the full catalog with a focused clear action', async () => {
    await page.getByRole('tab', { name: 'Database', exact: true }).click();
    await page.getByRole('group', { name: 'Filter studies by classification', exact: true }).getByRole('button', { name: 'TIA', exact: true }).click();
    expect(await page.locator('#trials-database-panel article').count()).toBe(1);
    expect(await page.locator('#trials-database-panel article').innerText()).toContain('CLARITY');
    await page.getByRole('group', { name: 'Filter studies by status', exact: true }).getByRole('button', { name: /^Recruiting at recorded check/ }).click();
    expect(await page.locator('#trials-database-panel article').count()).toBe(0);
    await page.getByRole('button', { name: 'Clear search and filters', exact: true }).click();
    expect(await page.locator('#trials-database-panel article').count()).toBe(14);
    expect(await page.getByRole('searchbox').evaluate(el => el === document.activeElement)).toBe(true);
    await page.getByRole('group', { name: 'Filter studies by classification', exact: true }).getByRole('button', { name: 'Hemorrhage (ICH)', exact: true }).click();
    await page.getByRole('group', { name: 'Filter studies by status', exact: true }).getByRole('button', { name: /^Not enrolling in stored profile/ }).click();
    expect(await page.locator('#trials-database-panel article').count()).toBe(1);
    expect(await page.locator('#trials-database-panel article').innerText()).toContain('CAPPRICORN-1');
  });

  it('shows four-column tables on desktop and the same source content in stacked mobile cards', async () => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole('tab', { name: 'Tables', exact: true }).click();
    const title = eligibilityTables[0].title;
    const table = page.getByRole('table', { name: title, exact: true });
    expect(await table.isVisible()).toBe(true);
    expect(await table.getByRole('columnheader').allTextContents()).toEqual(['Study', 'Summary', 'Inclusion criteria', 'Exclusion criteria']);
    expect(await table.innerText()).toContain('Recorded registry check: 2026-10-01');
    expect(await table.innerText()).toContain('Local activation is not confirmed');
    await page.setViewportSize({ width: 390, height: 844 });
    const cards = page.locator(`[aria-label="${title} study cards"]`);
    expect(await cards.isVisible()).toBe(true);
    expect(await page.getByRole('table', { name: title, exact: true }).count()).toBe(0);
    expect(await cards.locator('article').count()).toBe(2);
    expect(await cards.innerText()).toContain('STEP');
    expect(await cards.innerText()).toContain('PICASSO');
    expect(await cards.innerText()).toContain('Recorded registry check: 2026-10-01');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  it('preserves full source gaps and dated status in both table export formats', () => {
    for (const table of eligibilityTables) {
      for (const buildCopy of [buildTableHtml, buildTableMarkdown]) {
        const text = buildCopy(table);
        for (const trial of table.trials) {
          expect(text).toContain(trial.acronym);
          expect(text).toContain(trial.sourceDate || 'not recorded in this table');
          expect(text).toContain('Local activation is not confirmed');
          if (trial.sourceGaps?.length) expect(text).toContain('Source gaps / confirmation required');
        }
      }
    }
  });
});
