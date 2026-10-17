// Global search reaches the Trials database profiles (TO-8 / SPS-05). Renders the real
// QuickSearch with no `trials` prop, exactly as src/app.jsx does, in Chromium. The reference download is
// unavailable here (about:blank cannot resolve ./data/...), so the test also shows that
// study records do not depend on the Evidence download.
import { beforeAll, afterAll, beforeEach, afterEach, describe, it, expect } from 'vitest';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { screenerTrials } from '../src/evidence/screenerTrials.js';
import { buildSearchIndex, searchIndex } from '../src/quick-search-index.js';

const BUILD_SIGNATURE = "export function buildSearchIndex(reference, { protocolSub = 'ischemic' } = {}) {";
let browser, page, script;
beforeAll(async () => {
  const result = await build({ bundle: true, write: false, format: 'iife', platform: 'browser',
    // Count index builds without touching the shipped module.
    plugins: [{ name: 'count-index-builds', setup(builder) {
      builder.onLoad({ filter: /quick-search-index\.js$/ }, async ({ path }) => {
        const source = await readFile(path, 'utf8');
        if (!source.includes(BUILD_SIGNATURE)) throw new Error('buildSearchIndex signature changed; update the counter');
        return { contents: source.replace(BUILD_SIGNATURE, `${BUILD_SIGNATURE} globalThis.__qsBuilds = (globalThis.__qsBuilds || 0) + 1;`), loader: 'js' };
      });
    } }],
    stdin: { resolveDir: fileURLToPath(new URL('../', import.meta.url)), loader: 'jsx', contents: `
      import React, { useState } from 'react';
      import { createRoot } from 'react-dom/client';
      import QuickSearch from './src/components/QuickSearch.jsx';
      function Harness() {
        const [open, setOpen] = useState(true), [, setTick] = useState(0);
        window.rerender = () => setTick(value => value + 1);
        return <QuickSearch open={open} onClose={() => setOpen(false)} version="test" />;
      }
      createRoot(document.getElementById('root')).render(<Harness />);
    ` } });
  script = result.outputFiles[0].text;
  browser = await chromium.launch();
});
beforeEach(async () => {
  page = await browser.newPage();
  page.setDefaultTimeout(10000);
  await page.setContent('<div id="root"></div>');
  await page.addScriptTag({ content: script });
  await page.locator('dialog.quick-search[open] input').waitFor();
});
afterEach(async () => { await page?.close(); });
afterAll(async () => { await browser?.close(); });

const options = () => page.locator('#quick-search-results [role="option"]').evaluateAll(nodes => nodes.map(node => ({
  group: node.closest('[role="group"]').querySelector('.quick-search__group').textContent,
  title: node.querySelector('.quick-search__title').textContent,
  meta: node.querySelector('.quick-search__meta')?.textContent || '',
  href: node.getAttribute('href')
})));

describe('global search reaches study profiles', () => {
  it('finds CLARITY by NCT number with its registry status first', async () => {
    await page.fill('dialog.quick-search input', 'NCT07174414');
    expect(await options()).toEqual([{ group: 'Trials', title: 'CLARITY', meta: 'Not yet recruiting · Cilostazol for Prevention of Recurrent Stroke', href: '#/trials/database' }]);
  });
  // Registry statuses read on ClinicalTrials.gov 2026-10-17: NCT05948566 RECRUITING,
  // NCT07174414 NOT_YET_RECRUITING, NCT05047172 ACTIVE_NOT_RECRUITING, NCT06682429 RECRUITING.
  it('finds SISTER by acronym as a recruiting study', async () => {
    await page.fill('dialog.quick-search input', 'SISTER');
    expect((await options())[0]).toEqual({ group: 'Trials', title: 'SISTER', meta: 'Recruiting · Strategy for Improving Stroke Treatment Response (SISTER) Trial', href: '#/trials/database' });
  });
  it('finds TELE-REHAB-2 by its registry acronym and opens the study database', async () => {
    await page.fill('dialog.quick-search input', 'tr2');
    expect(await options()).toEqual([{ group: 'Trials', title: 'TELE-REHAB-2', meta: 'Recruiting · Telerehabilitation in the home after stroke', href: '#/trials/database' }]);
    await page.fill('dialog.quick-search input', 'NCT06682429');
    await page.keyboard.press('Enter');
    expect(await page.evaluate(() => location.hash)).toBe('#/trials/database');
    expect(await page.locator('dialog.quick-search[open]').count()).toBe(0);
  });
  it('labels studies that are not enrolling instead of listing them like open studies', async () => {
    await page.fill('dialog.quick-search input', 'CAPTIVA');
    expect((await options())[0]).toMatchObject({ title: 'CAPTIVA', meta: expect.stringMatching(/^Not enrolling \(active, not recruiting\) · /) });
  });
  it('indexes every study profile by acronym and NCT number', async () => {
    for (const trial of screenerTrials) {
      for (const query of [trial.acronym, trial.externalMetadata.nct]) {
        await page.fill('dialog.quick-search input', query);
        expect((await options()).filter(option => option.group === 'Trials').map(option => option.title), query).toContain(trial.acronym);
      }
    }
  });
  it('builds the index once per data change, not on every keystroke or parent render', async () => {
    const before = await page.evaluate(() => globalThis.__qsBuilds);
    expect(before).toBeGreaterThan(0);
    await page.locator('dialog.quick-search input').pressSequentially('carotid', { delay: 10 });
    await page.evaluate(() => { window.rerender(); window.rerender(); window.rerender(); });
    await page.waitForTimeout(50);
    expect(await page.evaluate(() => globalThis.__qsBuilds)).toBe(before);
  });
});

describe('trial records leave the other search groups alone', () => {
  it('returns the same Protocols records with and without trials, on both protocol tabs', () => {
    const trials = screenerTrials.map(trial => ({ acronym: trial.acronym, nct: trial.externalMetadata?.nct, body: trial.exactFullStudyName }));
    for (const protocolSub of ['ischemic', 'ich']) {
      for (const query of ['reversal', 'blood pressure', 'tnk', 'sah', 'thrombectomy', 'angioedema']) {
        const protocols = index => searchIndex(index, query, Infinity).filter(record => record.group === 'Protocols').map(record => record.href);
        expect(protocols(buildSearchIndex({ trials }, { protocolSub }))).toEqual(protocols(buildSearchIndex(null, { protocolSub })));
      }
    }
  });
});
