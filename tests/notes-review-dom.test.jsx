// Browser checks for the 7.8 documentation review: bulk NIHSS confirmation and provenance,
// prompt-blank caution, agent confirmation, copy-gate field names and format/context help.
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
    import { newEncounter, updateEncounter, buildSummary, protocolEncounter } from './src/workspace-state.js';
    const root = createRoot(document.getElementById('root'));
    const now = new Date('2026-10-01T12:00:00').getTime();
    window.state = newEncounter();
    window.state.note.diagnosisCategory = 'ischemic';
    Object.assign(window.state, window.initialPatch || {});
    window.summary = () => buildSummary(window.state, now);
    window.protocol = () => JSON.stringify(protocolEncounter(window.state, now));
    const update = patch => { window.state = updateEncounter(window.state, patch); render(); };
    function render() { flushSync(() => root.render(<Encounter state={window.state} update={update} now={now} onGenerate={text => { window.state = { ...window.state, draft: { text, revision: window.state.revision, stale: false } }; render(); }} onCopy={() => {}} onGenerateAndCopy={() => {}} copyStatus="" onReset={() => {}} />)); }
    render();
  ` } });
  script = bundled.outputFiles[0].text;
  browser = await chromium.launch({ headless: true });
}, 30000);
afterAll(async () => { await browser?.close(); });

const open = async (initialPatch) => {
  const page = await browser.newPage({ timezoneId: 'UTC', hasTouch: true });
  page.setDefaultTimeout(4000);
  await page.setContent('<div id="root"></div>');
  if (initialPatch) await page.evaluate(patch => { window.initialPatch = patch; }, initialPatch);
  await page.addScriptTag({ content: script });
  await page.evaluate(() => { for (const d of document.querySelectorAll('details')) d.open = true; });
  return page;
};
const nihssResult = page => page.locator('#calc-nihss .workspace-result').first().innerText();

describe('bulk NIHSS zero in the browser', () => {
  it('asks first, fills nothing when declined, and records bulk entry when accepted', async () => {
    const page = await open();
    try {
      const messages = [];
      page.once('dialog', dialog => { messages.push(dialog.message()); dialog.dismiss(); });
      await page.getByRole('button', { name: 'Set unentered items to 0', exact: true }).click();
      expect(messages[0]).toMatch(/^Set 15 unentered NIHSS items to 0\? Only do this after examining each item/);
      expect(await nihssResult(page)).toBe('0/15 items documented · partial sum 0');
      // Score 5a = 2 first, then accept the bulk fill: 2 + 14 × 0 = 2.
      await page.getByRole('radiogroup', { name: '5a. Motor Arm-Left' }).getByRole('radio', { name: /Some effort against gravity/ }).check();
      page.once('dialog', dialog => { messages.push(dialog.message()); dialog.accept(); });
      await page.getByRole('button', { name: 'Set unentered items to 0', exact: true }).click();
      expect(messages[1]).toMatch(/^Set 14 unentered NIHSS items to 0\?/);
      expect(await nihssResult(page)).toBe('Complete NIHSS: 2/42 · 14 items set to 0 by bulk entry');
      expect(await page.evaluate(() => window.summary())).toContain('2/42 (all items documented; 14 items set to 0 by bulk entry, not individually scored');
      // Tapping an already-checked bulk 0 confirms that item individually.
      await page.getByRole('radiogroup', { name: '1a. Level of Consciousness' }).getByRole('radio', { name: /Alert/ }).click();
      expect(await nihssResult(page)).toBe('Complete NIHSS: 2/42 · 13 items set to 0 by bulk entry');
      // Keyboard scoring also clears the bulk mark.
      await page.locator('#nihss-loc_questions').focus();
      await page.keyboard.press('0');
      expect(await nihssResult(page)).toBe('Complete NIHSS: 2/42 · 12 items set to 0 by bulk entry');
      // Complete exam: the button is inert and asks nothing.
      let asked = false; page.once('dialog', dialog => { asked = true; dialog.dismiss(); });
      await page.getByRole('button', { name: 'Set unentered items to 0', exact: true }).click({ force: true });
      expect(asked).toBe(false);
      expect(await page.getByRole('button', { name: 'Set unentered items to 0', exact: true }).getAttribute('aria-disabled')).toBe('true');
    } finally { await page.close(); }
  }, 20000);
});

describe('documentation cautions in the browser', () => {
  it('warns about unfilled prompt blanks', async () => {
    const page = await open();
    try {
      await page.getByRole('button', { name: 'IVT discussion', exact: true }).click();
      expect(await page.locator('#handoff').innerText()).toContain('5 documentation prompt blanks remain unfilled; they will print as "blank; not documented".');
    } finally { await page.close(); }
  });
  it('asks to confirm an agent pre-filled from the dose calculation', async () => {
    const page = await open({ drug: 'Alteplase' });
    try {
      await page.getByLabel('IV thrombolytic administration explicitly recorded').check();
      const section = page.locator('#handoff');
      expect(await section.innerText()).toContain('Pre-filled from the dose-calculation selection: confirm the agent actually given.');
      const before = await page.evaluate(() => window.protocol());
      await page.getByRole('button', { name: 'Confirm alteplase given', exact: true }).click();
      expect(await section.innerText()).not.toContain('Pre-filled from the dose-calculation selection');
      expect(await page.evaluate(() => window.state.actions.agentConfirmed)).toBe('Alteplase');
      expect(await page.evaluate(() => window.protocol())).toBe(before);
    } finally { await page.close(); }
  });
  it('names a hidden flagged field and can clear it', async () => {
    const page = await open({ details: { ichSurgicalPlan: `call neurosurgery ${['206', '555', '0123'].join('-')}` } });
    try {
      const alert = page.getByRole('alert');
      expect(await alert.innerText()).toContain('Flagged: "Neurosurgical findings / decision" (hidden: retained from an earlier diagnosis or plan).');
      expect(await page.getByRole('button', { name: /^Copy / }).first().isDisabled()).toBe(true);
      page.once('dialog', dialog => dialog.accept());
      await page.getByRole('button', { name: 'Clear hidden flagged entries', exact: true }).click();
      expect(await page.getByRole('alert').count()).toBe(0);
      expect(await page.evaluate(() => window.state.details.ichSurgicalPlan)).toBeUndefined();
    } finally { await page.close(); }
  });
  it('explains acute wording in a follow-up note only for the acute context', async () => {
    const page = await open({ documentFormat: 'follow-up' });
    try {
      const help = 'Follow-up note uses acute-consultation wording while Context is Acute consultation';
      expect(await page.locator('#handoff').innerText()).toContain(help);
      await page.getByLabel('Context', { exact: true }).selectOption('follow-up');
      expect(await page.locator('#handoff').innerText()).not.toContain(help);
    } finally { await page.close(); }
  });
});
