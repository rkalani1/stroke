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
      import { newEncounter } from './src/workspace-state.js';
      window.newEncounter = newEncounter;
      function Harness() {
        const [sub,setSub] = useState('screener'), [active,setActive] = useState(true), [encounter,setEncounter] = useState(null);
        window.setTrialsActive = setActive; window.setTrialsView = setSub; window.setEncounter = setEncounter;
        return <Trials sub={sub} onNavigate={setSub} active={active} encounter={encounter} now={Date.now()} />;
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
  it('keeps three readable study-screening views in one row on narrow phones', async () => {
    await page.setViewportSize({ width: 320, height: 700 });
    expect(await page.getByRole('tab').allTextContents()).toEqual(['Screener', 'Tables', 'Database']);
    expect(await page.locator('#trials-completed-panel').count()).toBe(0);
    const geometry = await page.getByRole('tab').evaluateAll(tabs => tabs.map(tab => {
      const rect = tab.getBoundingClientRect();
      return { top: rect.top, width: rect.width, height: rect.height, fits: tab.scrollWidth <= tab.clientWidth };
    }));
    expect(new Set(geometry.map(tab => tab.top)).size).toBe(1);
    expect(Math.max(...geometry.map(tab => tab.width)) - Math.min(...geometry.map(tab => tab.width))).toBeLessThan(1);
    expect(geometry.every(tab => tab.fits && tab.height >= 44)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
  it('moves the selected tab and focus with arrows, Home and End', async () => {
    await page.getByRole('tab', { name: 'Screener', exact: true }).focus();
    for (const [key, label] of [['ArrowRight', 'Tables'], ['End', 'Database'], ['ArrowRight', 'Screener'], ['ArrowLeft', 'Database'], ['ArrowLeft', 'Tables'], ['Home', 'Screener']]) {
      await page.keyboard.press(key);
      const selected = page.getByRole('tab', { name: label, exact: true });
      expect(await selected.getAttribute('aria-selected')).toBe('true');
      expect(await selected.evaluate(el => el === document.activeElement)).toBe(true);
      expect(await page.locator('[role="tab"][tabindex="0"]').count()).toBe(1);
    }
  });
  it('starts unknown, preserves two-tap screening across views, and resets to unknown', async () => {
    expect(await page.getByRole('button', { name: 'Copy screening summary' }).count()).toBe(0);
    await page.getByRole('button', { name: 'Ischemic stroke', exact: true }).click();
    expect(await page.getByText('Onset not recorded; timing remains unknown.', { exact: false }).count()).toBe(1);
    expect(await page.getByRole('button', { name: '< 4.5h Hyperacute' }).getAttribute('aria-pressed')).toBe('false');
    await page.getByRole('button', { name: '< 4.5h Hyperacute' }).click();
    await page.getByRole('tab', { name: 'Tables', exact: true }).click();
    await page.getByRole('tab', { name: 'Screener', exact: true }).click();
    expect(await page.getByRole('button', { name: '< 4.5h Hyperacute' }).getAttribute('aria-pressed')).toBe('true');
    await page.getByRole('button', { name: 'Reset screen', exact: true }).click();
    expect(await page.getByRole('button', { name: 'Copy screening summary' }).count()).toBe(0);
    expect(await page.getByRole('button', { name: 'Ischemic stroke', exact: true }).getAttribute('aria-pressed')).toBe('false');
  });

  it('retains dated source limits without removed visible framing', async () => {
    const body = await page.locator('body').innerText();
    expect(body).toContain('Screening does not determine treatment eligibility');
    expect(body).not.toMatch(/synthetic|public demo|\bPHI\b/i);
    await page.getByRole('tab', { name: 'Database', exact: true }).click();
    // The registry date and activation caveat are stated once for the page,
    // and in full in each study's details, instead of on every card.
    expect(body).toContain('First-pass registry screen (registry checked 2026-10-03) — confirm full criteria, local activation and consent.');
    await page.getByRole('searchbox').fill('NCT06289985');
    expect(await page.locator('#trials-database-panel article').count()).toBe(1);
    const card = await page.locator('#trials-database-panel article').innerText();
    expect(card).toContain('Recruiting');
    expect(card).toContain('Phase N/A');
    expect(card).not.toContain('Local activation');
    await page.getByRole('button', { name: 'Full criteria for STEP', exact: true }).click();
    const text = await page.getByRole('dialog').innerText();
    expect(text).toContain('Recorded registry check: 2026-10-03');
    expect(text).toContain('Local activation: not confirmed');
    expect(text).toContain('Inclusion criteria'); expect(text).toContain('Exclusion criteria');
    expect(text).toContain('Source gaps / confirmation required');
    expect(text).not.toMatch(/synthetic|public demo|\bPHI\b/i);
  });

  it('supports modal keyboard closure and removes portalled dialogs on leaving Trials', async () => {
    await page.getByRole('tab', { name: 'Database', exact: true }).click();
    await page.getByRole('searchbox').fill('STEP');
    const trigger = page.getByRole('button', { name: 'Full criteria for STEP', exact: true });
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
    await page.getByRole('button', { name: 'Copy screening summary', exact: true }).click();
    await page.getByText('Screening summary copied.', { exact: true }).waitFor();
    const copied = await page.evaluate(() => window.copies[0]);
    expect(copied).toContain('Inputs: Ischemic stroke · LKW unknown');
    expect(copied).toContain('ACT NOW — possible candidates');
    expect(copied).toContain('confirm full criteria, local activation and consent');
    expect(copied).toBe(await page.locator('[aria-label="Screening summary preview"]').textContent());
    await page.evaluate(() => { window.denyClipboard = true; });
    await page.getByRole('button', { name: 'Copy screening summary', exact: true }).click();
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
    const later = page.getByRole('region', { name: 'Later', exact: true });
    expect(await later.isVisible()).toBe(true);
    expect(await later.locator('article').count()).toBeGreaterThan(1);
    expect(await later.innerText()).toContain('Before study window');
    expect(await later.locator('article[data-trial="CLARITY"]').innerText()).toContain('Not yet recruiting');
    const excluded = page.locator('#trials-screener-panel details').filter({ has: page.locator('summary', { hasText: /^Modeled criterion not met/ }) });
    expect(await excluded.count()).toBe(0); // no informative miss yet; other stroke types are not listed
    expect(await page.locator('#trials-screener-panel').innerText()).not.toMatch(/Requires ICH/);
    await page.getByRole('button', { name: 'Copy screening summary', exact: true }).click();
    const copied = await page.evaluate(() => window.copies[0]);
    expect(copied).toContain('LATER (');
    expect(copied).toContain('CLARITY (NCT07174414) · Not yet recruiting');
    expect(copied).toBe(await page.locator('[aria-label="Screening summary preview"]').textContent());
    await page.getByRole('button', { name: 'Clear onset to unknown', exact: true }).click();
    expect(await page.locator('#trials-screener-panel article[data-trial="SISTER"]').innerText()).toContain('Recruiting');
    expect(await page.locator('[aria-label="Screening summary preview"]').textContent()).toContain('LKW unknown');
  });

  it('combines independent database filters and restores the full catalog with a focused clear action', async () => {
    await page.getByRole('tab', { name: 'Database', exact: true }).click();
    await page.getByRole('group', { name: 'Filter studies by classification', exact: true }).getByRole('button', { name: 'TIA', exact: true }).click();
    expect(await page.locator('#trials-database-panel article').count()).toBe(2);
    expect(await page.locator('#trials-database-panel article').allInnerTexts()).toEqual([expect.stringContaining('CLARITY'), expect.stringContaining('INTERCEPT')]);
    await page.getByRole('group', { name: 'Filter studies by status', exact: true }).getByRole('button', { name: /^Not yet recruiting/ }).click();
    expect(await page.locator('#trials-database-panel article').count()).toBe(1);
    await page.getByRole('group', { name: 'Filter studies by status', exact: true }).getByRole('button', { name: /^Not enrolling/ }).click();
    expect(await page.locator('#trials-database-panel article').count()).toBe(0);
    await page.getByRole('button', { name: 'Clear search and filters', exact: true }).click();
    expect(await page.locator('#trials-database-panel article').count()).toBe(16);
    expect(await page.getByRole('searchbox').evaluate(el => el === document.activeElement)).toBe(true);
    await page.getByRole('group', { name: 'Filter studies by status', exact: true }).getByRole('button', { name: /^Not enrolling/ }).click();
    const closed = await page.locator('#trials-database-panel article').allInnerTexts();
    expect(closed).toEqual([expect.stringContaining('CAPPRICORN-1'), expect.stringContaining('CAPTIVA')]);
    expect(closed.every(text => text.includes('Not enrolling (active, not recruiting)'))).toBe(true);
  });

  it('shows four-column tables on desktop and the same source content in stacked mobile cards', async () => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole('tab', { name: 'Tables', exact: true }).click();
    const title = eligibilityTables[0].title;
    const table = page.getByRole('table', { name: title, exact: true });
    expect(await table.isVisible()).toBe(true);
    expect(await table.getByRole('columnheader').allTextContents()).toEqual(['Study', 'Summary', 'Inclusion criteria', 'Exclusion criteria']);
    expect(await table.innerText()).toContain('Recorded registry check: 2026-10-03');
    expect(await table.innerText()).toContain('Recruiting at recorded check · Phase 2');
    expect(await table.innerText()).toContain('Local activation is not confirmed');
    await page.setViewportSize({ width: 390, height: 844 });
    const cards = page.locator(`[aria-label="${title} study cards"]`);
    expect(await cards.isVisible()).toBe(true);
    expect(await page.getByRole('table', { name: title, exact: true }).count()).toBe(0);
    expect(await cards.locator('article').count()).toBe(3);
    expect(await cards.innerText()).toContain('STEP');
    expect(await cards.innerText()).toContain('PICASSO');
    expect(await cards.innerText()).toContain('not modeled in the screener');
    expect(await cards.innerText()).toContain('Recorded registry check: 2026-10-03');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  it('shows the enrolling studies before a classification is chosen', async () => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const overview = page.getByRole('region', { name: 'Studies in this screener', exact: true });
    expect(await overview.isVisible()).toBe(true);
    const text = await overview.innerText();
    for (const acronym of ['STEP', 'SISTER', 'FASTEST-2', 'MINUTE', 'CLARITY']) expect(text).toContain(acronym);
    expect(text).toContain('Criteria-table reference only (not screened): PICASSO');
    expect(text).toContain('Not enrolling: CAPPRICORN-1, CAPTIVA');
    await overview.getByRole('button', { name: 'Full criteria for FASTEST-2', exact: true }).click();
    expect(await page.getByRole('dialog').innerText()).toContain('Recombinant Factor VIIa');
  });

  it('imports Encounter facts only on request and still allows every field to be changed', async () => {
    expect(await page.getByRole('region', { name: 'Encounter facts' }).count()).toBe(0);
    await page.evaluate(() => {
      const s = window.newEncounter();
      const lkw = new Date(Date.now() - 1.5 * 3600000);
      const pad = n => String(n).padStart(2, '0');
      Object.assign(s.note, { diagnosisCategory: 'ich', age: '60', premorbidMRS: '0', lastDOACType: 'apixaban', lkwDate: `${lkw.getFullYear()}-${pad(lkw.getMonth() + 1)}-${pad(lkw.getDate())}`, lkwTime: `${pad(lkw.getHours())}:${pad(lkw.getMinutes())}` });
      s.gcs = { eye: '4', verbal: '4', motor: '6' };
      s.volume = { a: '4', b: '3', thicknessMm: '5', numSlices: '8' };
      window.setEncounter(s);
    });
    const banner = page.getByRole('region', { name: 'Encounter facts' });
    await banner.waitFor();
    expect(await banner.innerText()).toMatch(/From Encounter: ICH · LKW 1\.\d h · 60 y · GCS 14 · 24\.0 mL · pre-mRS 0 · on DOAC/);
    // Nothing is applied automatically.
    expect(await page.getByRole('button', { name: 'Hemorrhage (ICH)', exact: true }).getAttribute('aria-pressed')).toBe('false');
    await banner.getByRole('button', { name: 'Use these facts', exact: true }).click();
    expect(await page.getByRole('button', { name: 'Hemorrhage (ICH)', exact: true }).getAttribute('aria-pressed')).toBe('true');
    expect(await page.getByLabel('GCS', { exact: true }).inputValue()).toBe('14');
    expect(await page.getByLabel('Volume (mL)').inputValue()).toBe('24');
    expect(await page.getByLabel('Anticoagulant at onset').inputValue()).toBe('doac');
    expect(Number(await page.getByLabel('Exact hours from LKW').inputValue())).toBeCloseTo(1.5, 1);
    const notMet = page.locator('#trials-screener-panel details').filter({ has: page.locator('summary', { hasText: /^Modeled criterion not met/ }) });
    await notMet.locator('summary').click();
    expect(await notMet.innerText()).toContain('Concurrent DOAC or LMWH at ICH onset');
    expect(await notMet.innerText()).toContain('Oral anticoagulant (VKA or DOAC) within 7 days');
    // Override: no anticoagulant and a basal ganglia location make both studies possible again.
    await page.getByLabel('Anticoagulant at onset').selectOption('none');
    await page.getByLabel('ICH location').selectOption('bg');
    const candidates = page.getByRole('region', { name: 'Possible candidates', exact: true });
    expect(await candidates.locator('article[data-trial="FASTEST-2"]').count()).toBe(1);
    expect(await candidates.locator('article[data-trial="MINUTE"]').count()).toBe(1);
    await page.getByLabel('Anticoagulant at onset').selectOption('');
    expect(await page.getByLabel('DOAC or LMWH at ICH onset').inputValue()).toBe('');
  });

  it('reports unmodeled Encounter diagnoses without offering an import', async () => {
    await page.evaluate(() => { const s = window.newEncounter(); s.note.diagnosisCategory = 'cvt'; window.setEncounter(s); });
    const banner = page.getByRole('region', { name: 'Encounter facts' });
    await banner.waitFor();
    expect(await banner.innerText()).toContain('From Encounter: CVT — No modeled studies for this diagnosis');
    expect(await banner.getByRole('button').count()).toBe(0);
  });

  it('shows compact candidate cards with chips and an expandable confirmation list', async () => {
    await page.getByRole('button', { name: 'Ischemic stroke', exact: true }).click();
    await page.getByLabel('Exact hours from LKW').fill('3');
    await page.getByLabel('Age (y)').fill('72');
    await page.getByLabel('NIHSS', { exact: true }).fill('3');
    await page.getByLabel('Occlusion site').selectOption('ica_m1');
    const step = page.locator('#trials-screener-panel article[data-trial="STEP"]');
    const text = await step.innerText();
    expect(text).toContain('NCT06289985');
    expect(text).toContain('Recruiting');
    expect(text).toContain('Phase N/A');
    expect(text).not.toMatch(/Local activation|Registry status at recorded check/);
    const summary = step.locator('summary');
    expect(await summary.innerText()).toMatch(/^\d+ to confirm · \d+ met$/);
    await summary.click();
    const list = await step.locator('details').innerText();
    expect(list).toContain('Meets Branch 1');
    expect(list).toContain('Confirm pre-stroke mRS ≤ 2');
    expect(list).not.toMatch(/\{value\}/);
    expect(list).not.toContain('Full registry/protocol, local activation and consent confirmation required');
  });

  it('finds registry acronyms and table-only studies in Database search', async () => {
    await page.getByRole('tab', { name: 'Database', exact: true }).click();
    for (const [query, acronym] of [['TR-2', 'TELE-REHAB-2'], ['tr2', 'TELE-REHAB-2'], ['SCOUTS3', 'SCOUTS-3'], ['MRPICS', 'MR-PICS'], ['cAPPricorn-1', 'CAPPRICORN-1'], ['PICASSO', 'PICASSO'], ['FASTEST Part 2', 'FASTEST-2'], ['captiva', 'CAPTIVA']]) {
      await page.getByRole('searchbox').fill(query);
      const cards = page.locator('#trials-database-panel article');
      expect(await cards.count(), query).toBe(1);
      expect(await cards.getAttribute('data-trial'), query).toBe(acronym);
    }
    expect(await page.locator('#trials-database-panel article').innerText()).toContain('Not enrolling');
    await page.getByRole('searchbox').fill('PICASSO');
    expect(await page.locator('#trials-database-panel article').innerText()).toContain('Not screened');
    await page.getByRole('searchbox').fill('STEP');
    expect((await page.locator('#trials-database-panel article').allInnerTexts()).some(text => text.includes('PICASSO'))).toBe(false);
  });

  it('fits 390 px without horizontal overflow or small targets in light and dark themes', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const theme of ['light', 'dark']) {
      await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
      await page.getByRole('button', { name: 'Hemorrhage (ICH)', exact: true }).click();
      await page.getByRole('button', { name: '< 4.5h Hyperacute' }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), theme).toBe(true);
      const small = await page.locator('#trials-screener-panel').evaluate(panel => [...panel.querySelectorAll('button, select, input, summary, a[href]')].filter(el => el.offsetParent !== null).filter(el => el.getBoundingClientRect().height < 44).map(el => el.outerHTML.slice(0, 80)));
      expect(small, theme).toEqual([]);
    }
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
