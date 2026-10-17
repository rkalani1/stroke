// DOM checks for the 2026-10-17 Trials review: live Encounter LKW timing,
// the three visible screening states, and the Database ICH filter.
import { beforeAll, afterAll, afterEach, describe, it, expect } from 'vitest';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

let browser, page, script, css;
beforeAll(async () => {
  css = await readFile(new URL('../tailwind.css', import.meta.url), 'utf8');
  const result = await build({ bundle: true, write: false, format: 'iife', platform: 'browser', stdin: {
    resolveDir: fileURLToPath(new URL('../', import.meta.url)), loader: 'jsx', contents: `
      import React, { useState } from 'react';
      import { createRoot } from 'react-dom/client';
      import Trials from './src/Trials.jsx';
      import { newEncounter } from './src/workspace-state.js';
      window.newEncounter = newEncounter;
      function Harness() {
        const [sub, setSub] = useState('screener'), [encounter, setEncounter] = useState(null);
        window.setEncounter = setEncounter;
        return <Trials sub={sub} onNavigate={setSub} active encounter={encounter} now={Date.now()} />;
      }
      createRoot(document.getElementById('root')).render(<Harness />);
    `
  } });
  script = result.outputFiles[0].text;
  browser = await chromium.launch();
});
const open = async (time = new Date('2026-10-17T12:00:00')) => {
  page = await browser.newPage();
  page.setDefaultTimeout(10000);
  await page.clock.install({ time });
  await page.setContent('<div id="root"></div>');
  await page.addStyleTag({ content: css });
  await page.evaluate(() => { window.copies = []; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.copies.push(text); } } }); });
  await page.addScriptTag({ content: script });
  await page.getByRole('heading', { name: 'Trials', exact: true }).waitFor();
};
afterEach(async () => { await page?.close(); });
afterAll(async () => { await browser?.close(); });

describe('Trials review 2026-10-17', () => {
  it('keeps Encounter LKW timing live so FASTEST-2 leaves the candidates when its 120-minute window closes', async () => {
    await open();
    await page.evaluate(() => {
      const s = window.newEncounter();
      Object.assign(s.note, { diagnosisCategory: 'ich', age: '60', lkwDate: '2026-10-17', lkwTime: '11:00' });
      window.setEncounter(s);
    });
    await page.getByRole('region', { name: 'Encounter facts' }).getByRole('button', { name: 'Use these facts', exact: true }).click();
    const candidates = page.getByRole('region', { name: 'Possible candidates', exact: true });
    expect(await candidates.locator('article[data-trial="FASTEST-2"]').count()).toBe(1);
    expect(await page.getByText('Live from the Encounter LKW time', { exact: false }).count()).toBe(1);
    await page.clock.runFor(2 * 3600000); // 14:00, 3 h from LKW
    await page.waitForFunction(() => !document.querySelector('[aria-label="Possible candidates"] article[data-trial="FASTEST-2"]'));
    expect(Number(await page.getByLabel('Exact hours from LKW').inputValue())).toBeCloseTo(3, 1);
    const notMet = page.locator('#trials-screener-panel details').filter({ has: page.locator('summary', { hasText: /^Does not meet documented criteria/ }) });
    await notMet.locator('summary').click();
    expect(await notMet.innerText()).toContain('Beyond 120 minutes from onset/LKW');
    await page.getByRole('button', { name: 'Copy screening summary', exact: true }).click();
    await page.waitForFunction(() => window.copies.length === 1);
    expect(await page.evaluate(() => window.copies[0])).toContain('LKW 3.0 h (Encounter LKW 11:00, as of 14:00)');
    // A manual entry replaces the live anchor and then stays fixed.
    await page.getByLabel('Exact hours from LKW').fill('1');
    await page.clock.runFor(3600000);
    expect(await candidates.locator('article[data-trial="FASTEST-2"]').count()).toBe(1);
  }, 30000);

  it('separates potential matches from studies with insufficient information', async () => {
    await open();
    await page.getByRole('button', { name: 'Hemorrhage (ICH)', exact: true }).click();
    const match = page.getByRole('region', { name: 'Potential match', exact: true });
    const insufficient = page.getByRole('region', { name: 'Insufficient information', exact: true });
    expect(await match.locator('article').count()).toBe(0);
    expect(await match.innerText()).toContain('No study has every modeled criterion met.');
    expect(await insufficient.locator('article').count()).toBe(6);
    expect(await insufficient.locator('article[data-trial="MINUTE"]').innerText()).toMatch(/\d+ modeled facts unknown/);
    expect(await page.getByRole('heading', { name: /possible candidates/i }).count()).toBe(1);
    // Answer every modeled FASTEST-2 fact.
    await page.getByLabel('Exact hours from LKW').fill('1');
    await page.getByLabel('Age (y)').fill('70');
    await page.getByLabel('GCS', { exact: true }).selectOption('14');
    await page.getByLabel('Pre-stroke mRS').selectOption('0');
    await page.getByLabel('Volume (mL)').fill('20');
    await page.getByLabel('ICH location').selectOption('lobar');
    await page.locator('summary', { hasText: 'Optional exclusion review' }).click();
    for (const label of ['Oral anticoagulant (VKA or DOAC) within 7 days', 'Suspected secondary cause for ICH (AVM, aneurysm, tumor, SAH, trauma, coagulopathy)', 'Brainstem hemorrhage (cerebellar is not brainstem)', 'Pregnancy']) await page.getByLabel(label, { exact: true }).selectOption('false');
    expect(await match.locator('article').allInnerTexts()).toEqual([expect.stringContaining('FASTEST-2')]);
    expect(await match.locator('article[data-trial="FASTEST-2"]').innerText()).toContain('Recruiting (registry)');
    expect(await page.getByRole('status').filter({ hasText: 'potential match' }).innerText()).toMatch(/^1 potential match · \d+ insufficient information · \d+ later · \d+ not met$/);
  }, 30000);

  it('lists CAPPRICORN-1 under the Database ICH filter', async () => {
    await open();
    await page.getByRole('tab', { name: 'Database', exact: true }).click();
    await page.getByRole('group', { name: 'Filter studies by classification', exact: true }).getByRole('button', { name: 'Hemorrhage (ICH)', exact: true }).click();
    expect(await page.locator('#trials-database-panel article').evaluateAll(cards => cards.map(c => c.dataset.trial))).toEqual(['MINUTE', 'FASTEST-2', 'ASPIRE', 'SATURN', 'CAPPRICORN-1', 'SCOUTS-3', 'TELE-REHAB-2']);
    await page.getByRole('group', { name: 'Filter studies by status', exact: true }).getByRole('button', { name: /^Not enrolling/ }).click();
    expect(await page.locator('#trials-database-panel article').innerText()).toContain('Not enrolling (active, not recruiting)');
  }, 30000);
});
