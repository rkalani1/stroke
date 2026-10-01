import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

let browser, script;
beforeAll(async () => {
  const bundled = await build({ bundle: true, write: false, format: 'iife', platform: 'browser', stdin: { resolveDir: fileURLToPath(new URL('../', import.meta.url)), loader: 'jsx', contents: `
    import React from 'react';
    import { createRoot } from 'react-dom/client';
    import { flushSync } from 'react-dom';
    import Encounter from './src/Encounter.jsx';
    import { PocketCards } from './src/pocket-cards.jsx';
    import { newEncounter, updateEncounter, protocolEncounter, buildSummary } from './src/workspace-state.js';
    import { NIHSS_ITEMS } from './src/clinical/nihss-items.js';
    const root = createRoot(document.getElementById('root'));
    const now = window.testNow ?? new Date('2026-10-01T12:00:00').getTime();
    window.state = newEncounter();
    window.state.note.diagnosisCategory = 'ischemic';
    window.state.nihss = Object.fromEntries(NIHSS_ITEMS.map(item => [item.id, item.options[0]]));
    const update = patch => { window.state = updateEncounter(window.state, patch); render(); };
    function render() { flushSync(() => root.render(<><Encounter state={window.state} update={update} now={now} onGenerate={() => { window.state = { ...window.state, draft: { text: buildSummary(window.state, now), stale: false } }; render(); }} onCopy={() => {}} copyStatus="" onReset={() => { window.state = newEncounter(); render(); }} /><PocketCards encounter={protocolEncounter(window.state, now)} /></>)); }
    render();
  ` } });
  script = bundled.outputFiles[0].text;
  browser = await chromium.launch({ headless: true });
}, 30000);
afterAll(async () => { await browser?.close(); });

describe('reported NIHSS browser binding', () => {
  it('sets timestamps only on request, confirms replacements and keeps administration separate', async () => {
    const page = await browser.newPage({ timezoneId: 'America/Los_Angeles' });
    try {
      await page.setContent('<div id="root"></div>');
      await page.evaluate(() => { Date.now = () => new Date('2026-10-01T18:45:30Z').getTime(); });
      await page.addScriptTag({ content: script });
      const lkwDate = page.getByLabel('LKW date (local)', { exact: true });
      const lkwTime = page.getByLabel('LKW time (local)', { exact: true });
      expect(await lkwDate.inputValue()).toBe('');
      await page.getByRole('button', { name: 'Set LKW to now', exact: true }).click();
      expect(await lkwDate.inputValue()).toBe('2026-10-01');
      expect(await lkwTime.inputValue()).toBe('11:45:30');
      await lkwTime.fill('10:00');
      await page.getByRole('button', { name: 'Generate Pulsara summary', exact: true }).click();
      page.once('dialog', dialog => dialog.dismiss());
      await page.getByRole('button', { name: 'Set LKW to now', exact: true }).click();
      expect(await lkwTime.inputValue()).toBe('10:00');
      expect(await page.getByRole('button', { name: 'Copy Pulsara summary', exact: true }).count()).toBe(1);
      page.once('dialog', dialog => dialog.accept());
      await page.getByRole('button', { name: 'Set LKW to now', exact: true }).click();
      expect(await lkwTime.inputValue()).toBe('11:45:30');
      expect(await page.getByRole('button', { name: 'Copy Pulsara summary', exact: true }).count()).toBe(0);
      await page.getByText('Discovery / wake-up details', { exact: true }).click();
      await page.getByRole('button', { name: 'Set Discovery to now', exact: true }).click();
      expect(await page.getByLabel('Discovery time (local)', { exact: true }).inputValue()).toBe('11:45:30');
      await page.getByRole('button', { name: 'Set IVT timestamp to now', exact: true }).click();
      expect(await page.getByLabel('IVT administration timestamp (local)', { exact: true }).inputValue()).toBe('2026-10-01T11:45:30');
      expect(await page.getByLabel('IV thrombolytic administration explicitly recorded').isChecked()).toBe(false);
      expect(await page.locator('body').innerText()).toContain('Monitoring timer inactive');
      await page.getByText('Consultation timer & event timeline', { exact: true }).click();
      await page.getByRole('button', { name: 'Set ED arrival to now', exact: true }).click();
      expect(await page.evaluate(() => window.state.timeline.arrival)).toBe('2026-10-01T18:45:30.000Z');
      expect(await page.getByLabel('ED arrival (local)', { exact: true }).inputValue()).toBe('2026-10-01T11:45:30');
    } finally { await page.close(); }
  });
  it('preserves actual clock instants during the repeated DST hour', async () => {
    const page = await browser.newPage({ timezoneId: 'America/Los_Angeles' });
    try {
      await page.setContent('<div id="root"></div>');
      await page.evaluate(() => { window.testNow = Date.parse('2026-11-01T09:30:00Z'); Date.now = () => window.testNow; });
      await page.addScriptTag({ content: script });
      await page.getByRole('button', { name: 'Set LKW to now', exact: true }).click();
      expect(await page.getByLabel('LKW time (local)', { exact: true }).inputValue()).toBe('01:30:00');
      expect(await page.locator('#context').innerText()).toContain('LKW: 0 min elapsed');
      expect(await page.evaluate(() => window.state.note.lkwClock.instant)).toBe('2026-11-01T09:30:00.000Z');
      await page.getByText('Discovery / wake-up details', { exact: true }).click();
      await page.getByRole('button', { name: 'Set Discovery to now', exact: true }).click();
      await page.getByLabel('Last known well is unknown').check();
      expect(await page.locator('#context').innerText()).toContain('Discovery: 0 min elapsed');
      await page.getByRole('button', { name: 'Set IVT timestamp to now', exact: true }).click();
      const administration = page.getByLabel('IVT administration timestamp (local)', { exact: true });
      expect(await administration.inputValue()).toBe('2026-11-01T01:30');
      expect(await page.evaluate(() => window.state.actions.administrationTime)).toBe('2026-11-01T09:30:00.000Z');
      expect(await page.locator('#handoff').innerText()).toContain('Monitoring timer inactive');
      await page.getByLabel('Selected IV thrombolytic', { exact: true }).selectOption('TNK');
      await page.getByLabel('IV thrombolytic administration explicitly recorded').check();
      expect(await page.locator('#handoff').innerText()).toContain('q15 check #1');
      await page.getByRole('button', { name: 'Generate Pulsara summary', exact: true }).click();
      expect(await page.getByRole('button', { name: 'Copy Pulsara summary', exact: true }).count()).toBe(1);
      expect(await page.evaluate(() => window.state.draft.text)).toContain('recorded instant 2026-11-01T09:30:00.000Z');
      await administration.fill('2026-11-01T01:31');
      expect(await page.evaluate(() => window.state.actions.administrationTime)).toBe('2026-11-01T01:31');
      await administration.fill('');
      expect(await page.locator('#handoff').innerText()).toContain('Monitoring timer inactive');
    } finally { await page.close(); }
  });
  it('switches sources, retains entered values, clears protocol reviews and stale notes, and resets to unknown', async () => {
    const page = await browser.newPage();
    try {
      await page.setContent('<div id="root"></div>');
      await page.addScriptTag({ content: script });
      const source = page.getByLabel('Current NIHSS source', { exact: true });
      const reviewed = page.getByLabel('Absolute and relative contraindications reviewed', { exact: true });
      await reviewed.check();
      await page.getByRole('button', { name: 'Generate Pulsara summary', exact: true }).click();
      expect(await page.getByRole('button', { name: 'Copy Pulsara summary', exact: true }).count()).toBe(1);
      await source.selectOption('reported');
      expect(await reviewed.isChecked()).toBe(false);
      expect(await page.getByRole('button', { name: 'Copy Pulsara summary', exact: true }).count()).toBe(0);
      const report = page.getByLabel('Reported NIHSS total (0–42)', { exact: true });
      await report.fill('0');
      expect(await page.locator('#calc-nihss').innerText()).toContain('Reported NIHSS: 0/42');
      const protocolNihss = page.getByLabel('NIHSS', { exact: true });
      expect(await protocolNihss.inputValue()).toBe('0');
      await reviewed.check();
      await report.fill('12');
      expect(await reviewed.isChecked()).toBe(false);
      expect(await protocolNihss.inputValue()).toBe('12');
      await source.selectOption('itemized');
      expect(await page.locator('#calc-nihss').innerText()).toContain('Complete NIHSS: 0/42');
      expect(await protocolNihss.inputValue()).toBe('0');
      await source.selectOption('reported');
      expect(await report.inputValue()).toBe('12');
      await report.fill('43');
      expect(await protocolNihss.inputValue()).toBe('');
      await page.getByRole('button', { name: 'New encounter', exact: true }).click();
      expect(await source.inputValue()).toBe('itemized');
      expect(await page.locator('#calc-nihss').innerText()).toContain('0/15 items documented');
      await source.selectOption('reported');
      expect(await report.inputValue()).toBe('');
    } finally { await page.close(); }
  });
});
