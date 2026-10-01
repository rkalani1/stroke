import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

// Exercise React DOM updates with the same Chromium dependency already used
// by the protocol lock gate. No synthetic encounter data is persisted.
let browser, page, script;
const complete = {
  sourceKey: 'case-1', compatible: true,
  ivt: { age: '60', weight: '80', glucose: '100', hoursFromLKW: 1, wakeUpOrUnknownOnset: false, ichOnCT: false, disablingDeficit: true, preMRS: '0', bpSystolic: '180', bpDiastolic: '90' },
  anterior: { age: '60', nihss: 12, aspectsScore: '8', timeFromLKWh: 1, preMRS: '0', coreVolume: '20', massEffect: false },
  m2: { age: '60', nihss: 12, hoursFromLKWh: 1, preMRS: '0', aspectsScore: '8' },
  basilar: { age: '60', nihss: 12, hoursFromLKWh: 1, preMRS: '0', pcAspects: '8' },
};
const card = name => page.getByRole('heading').filter({ hasText: name.replace(/^INST /, '') }).locator('xpath=ancestor::div[contains(@class, "p-3")][1]');
const ivt = () => card('INST IVT Eligibility Decision Algorithm');
const evt = () => card('INST EVT Eligibility');
const safe = () => card('INST Safety Pause (pre-thrombolytic)');
const render = async (encounter = complete, defaults = {}) => page.evaluate(({ encounter, defaults }) => window.renderCards(encounter, defaults), { encounter, defaults });
const update = async encounter => page.evaluate(encounter => window.renderCards(encounter), encounter);

beforeAll(async () => {
  const bundled = await build({ bundle: true, write: false, format: 'iife', platform: 'browser', stdin: { resolveDir: fileURLToPath(new URL('../', import.meta.url)), loader: 'jsx', contents: `
    import React from 'react';
    import { createRoot } from 'react-dom/client';
    import { flushSync } from 'react-dom';
    import { PocketCards } from './src/pocket-cards.jsx';
    import ProtectedProtocols from './src/ProtectedProtocols.jsx';
    const root = createRoot(document.getElementById('root'));
    window.calls = [];
    window.renderProtocols = value => {
      flushSync(() => root.render(<ProtectedProtocols managementSubTab="ischemic" encounter={{ ...value, onChange: (key, value) => window.calls.push([key, value]) }} />));
    };
    window.renderCards = (value, defaults = {}) => {
      window.model = value;
      window.defaults = defaults;
      const encounter = value == null ? undefined : { ...value, onChange: (key, value) => {
        window.calls.push([key, value]);
        const next = { ...window.model, sourceKey: window.model.sourceKey + ':edit' };
        for (const branch of ['ivt', 'anterior', 'm2', 'basilar']) {
          next[branch] = { ...next[branch] };
          if (Object.hasOwn(next[branch], key)) next[branch][key] = value;
        }
        window.model = next;
        root.render(<PocketCards defaults={window.defaults} encounter={{ ...next, onChange: encounter.onChange }} />);
      }};
      flushSync(() => root.render(<PocketCards defaults={defaults} encounter={encounter} />));
    };
  ` } });
  script = bundled.outputFiles[0].text;
  browser = await chromium.launch({ headless: true });
}, 30000);
beforeEach(async () => {
  page = await browser.newPage();
  await page.setContent('<div id="root"></div>');
  await page.addScriptTag({ content: script });
});
afterEach(async () => { await page?.close(); });
afterAll(async () => { await browser?.close(); });

describe('canonical Encounter bindings in retained protocol cards', () => {
  it('uses changed and cleared canonical inputs across all branches without remounting or initialization callbacks', async () => {
    await render();
    await page.evaluate(() => { window.ageNode = document.querySelector('label:has(input) input[value="60"]'); });
    expect(await ivt().getByLabel('Age', { exact: true }).inputValue()).toBe('60');
    await update({ ...complete, sourceKey: 'case-2', ivt: { ...complete.ivt, age: '70', weight: '0', ichOnCT: null, disablingDeficit: false }, anterior: { ...complete.anterior, age: '70', nihss: '', aspectsScore: '', preMRS: '' }, m2: { ...complete.m2, age: '70', nihss: '', aspectsScore: '', preMRS: '' }, basilar: { ...complete.basilar, age: '70', nihss: '', pcAspects: '', preMRS: '' } });
    expect(await ivt().getByLabel('Age', { exact: true }).inputValue()).toBe('70');
    expect(await ivt().getByLabel('Weight (kg)', { exact: true }).inputValue()).toBe('0');
    expect(await ivt().getByLabel('CT hemorrhage assessment').inputValue()).toBe('');
    expect(await ivt().getByLabel('Deficit assessment').inputValue()).toBe('non-disabling');
    expect(await evt().getByLabel('NIHSS', { exact: true }).inputValue()).toBe('');
    expect(await evt().getByLabel('ASPECTS', { exact: true }).inputValue()).toBe('');
    await evt().getByRole('button', { name: 'M2 / Distal', exact: true }).click();
    expect(await evt().getByLabel('NIHSS', { exact: true }).inputValue()).toBe('');
    await evt().getByRole('button', { name: 'Basilar', exact: true }).click();
    expect(await evt().getByLabel('PC-ASPECTS').inputValue()).toBe('');
    expect(await page.evaluate(() => window.calls)).toEqual([]);
    expect(await page.evaluate(() => window.ageNode === document.querySelector('label:has(input) input[value="70"]'))).toBe(true);
  });

  it('writes editable overlaps to canonical state and keeps derived NIHSS and LKW read-only', async () => {
    await render();
    await ivt().getByLabel('Age', { exact: true }).fill('75');
    expect(await ivt().getByLabel('Age', { exact: true }).evaluate(node => node === document.activeElement)).toBe(true);
    expect(await evt().getByLabel('Age', { exact: true }).inputValue()).toBe('75');
    await evt().getByLabel('ASPECTS', { exact: true }).fill('0');
    await evt().getByRole('button', { name: 'M2 / Distal', exact: true }).click();
    expect(await evt().getByLabel('ASPECTS', { exact: true }).inputValue()).toBe('0');
    expect(await evt().getByLabel('NIHSS', { exact: true }).evaluate(node => node.readOnly)).toBe(true);
    expect(await evt().getByLabel('LKW (h)', { exact: true }).evaluate(node => node.readOnly)).toBe(true);
    expect(await ivt().getByLabel('LKW (h)', { exact: true }).evaluate(node => node.readOnly)).toBe(true);
    await ivt().getByLabel('Wake-up or unknown LKW (leave LKW hours blank)', { exact: true }).check();
    await ivt().getByLabel('CT hemorrhage assessment').selectOption('present');
    expect(await page.evaluate(() => window.calls)).toEqual([['age', '75'], ['aspectsScore', '0'], ['wakeUpOrUnknownOnset', true], ['ichOnCT', true]]);
    expect(await ivt().innerText()).toContain('IVT not recommended');
  });

  it('preserves independent reviews on navigation and timer ticks, then invalidates them before an edited source is evaluated', async () => {
    await render();
    await ivt().getByLabel('Absolute and relative contraindications reviewed', { exact: true }).check();
    expect(await ivt().innerText()).not.toContain('Final IVT safety gates incomplete');
    await evt().getByRole('button', { name: 'M2 / Distal', exact: true }).click();
    await evt().getByLabel('Segment').selectOption('M2-proximal-dominant');
    await evt().getByLabel('CTP hypoperfusion–hypodensity mismatch present (required beyond 6h)').check();
    await safe().getByLabel('Consent type').selectOption('informed');
    await safe().getByLabel('BP at attestation', { exact: true }).fill('178/96');
    await safe().getByLabel('Contraindications').selectOption('reviewed');
    await safe().getByLabel('Provider agreement').selectOption('confirmed');
    expect(await safe().getByRole('button', { name: 'Copy completed safety pause' }).isEnabled()).toBe(false);
    const tick = { ...complete, ivt: { ...complete.ivt, hoursFromLKW: 1.01 }, anterior: { ...complete.anterior, timeFromLKWh: 1.01 } };
    await update(tick);
    expect(await ivt().getByLabel('Absolute and relative contraindications reviewed', { exact: true }).isChecked()).toBe(true);
    expect(await evt().getByLabel('Segment').inputValue()).toBe('M2-proximal-dominant');
    expect(await safe().getByRole('button', { name: 'Copy completed safety pause' }).isEnabled()).toBe(false);
    expect(await safe().getByLabel('Consent type').inputValue()).toBe('informed');
    const immediate = await page.evaluate(value => {
      window.renderCards(value);
      return {
        reviewed: [...document.querySelectorAll('label')].find(label => label.textContent === 'Absolute and relative contraindications reviewed').querySelector('input').checked,
        enabled: [...document.querySelectorAll('button')].find(button => button.textContent === 'Copy completed safety pause').disabled === false,
        text: document.body.textContent,
      };
    }, { ...tick, sourceKey: 'case-edited', ivt: { ...tick.ivt, weight: '90' } });
    expect(immediate).toMatchObject({ reviewed: false, enabled: false });
    expect(immediate.text).toContain('Final IVT safety gates incomplete');
    expect(await evt().getByLabel('Segment').inputValue()).toBe('');
    expect(await evt().getByLabel('CTP hypoperfusion–hypodensity mismatch present (required beyond 6h)').isChecked()).toBe(false);
    expect(await safe().getByLabel('Consent type').inputValue()).toBe('');
  });

  it.each([true, false])('withholds unrecorded safety-pause events with compatible context %s', async compatible => {
    await render({ ...complete, compatible });
    await safe().getByLabel('Consent type').selectOption('informed');
    await safe().getByLabel('BP at attestation', { exact: true }).fill('178/96');
    await safe().getByLabel('Contraindications').selectOption('reviewed');
    await safe().getByLabel('Provider agreement').selectOption('confirmed');
    expect(await safe().getByRole('button', { name: 'Copy completed safety pause' }).isDisabled()).toBe(true);
    const text = await safe().locator('textarea').inputValue();
    expect(text).toContain('Completed attestation unavailable');
    expect(text).not.toMatch(/Dose confirmed|Pause performed|Pause confirmed|Safety pause documented/);
  });

  it('disables incompatible ischemic edits and preserves numeric zero and tri-state false values', async () => {
    const source = { ...complete, compatible: false, anterior: { ...complete.anterior, nihss: 0, aspectsScore: 0, massEffect: false }, m2: { ...complete.m2, nihss: 0, aspectsScore: 0 }, basilar: { ...complete.basilar, nihss: 0, pcAspects: 0 } };
    await render(source);
    expect(await ivt().getByLabel('CT hemorrhage assessment').isDisabled()).toBe(true);
    expect(await ivt().getByLabel('Deficit assessment').isDisabled()).toBe(true);
    expect(await ivt().getByLabel('Wake-up or unknown LKW (leave LKW hours blank)', { exact: true }).isDisabled()).toBe(true);
    expect(await ivt().getByLabel('Age', { exact: true }).isEnabled()).toBe(true);
    expect(await evt().getByLabel('ASPECTS', { exact: true }).isDisabled()).toBe(true);
    expect(await evt().getByLabel('CTP core (mL)', { exact: true }).isDisabled()).toBe(true);
    expect(await evt().getByLabel('Significant mass effect').isDisabled()).toBe(true);
    expect(await evt().getByLabel('Significant mass effect').inputValue()).toBe('absent');
    expect(await evt().getByLabel('NIHSS', { exact: true }).inputValue()).toBe('0');
    await evt().getByRole('button', { name: 'M2 / Distal', exact: true }).click();
    expect(await evt().getByLabel('NIHSS', { exact: true }).inputValue()).toBe('0');
    expect(await evt().getByLabel('ASPECTS', { exact: true }).isDisabled()).toBe(true);
    await evt().getByRole('button', { name: 'Basilar', exact: true }).click();
    expect(await evt().getByLabel('NIHSS', { exact: true }).inputValue()).toBe('0');
    expect(await evt().getByLabel('PC-ASPECTS').isDisabled()).toBe(true);
    expect(await page.evaluate(() => window.calls)).toEqual([]);
  });

  it('holds IVT despite a local review checkbox when canonical safety concerns remain', async () => {
    await render({ ...complete, safetyReviewRequired: true });
    await ivt().getByLabel('Absolute and relative contraindications reviewed', { exact: true }).check();
    expect(await ivt().getByLabel('Absolute and relative contraindications reviewed', { exact: true }).isChecked()).toBe(true);
    expect(await ivt().innerText()).toContain('Final IVT safety gates incomplete');
    await update({ ...complete, safetyReviewRequired: false });
    expect(await ivt().innerText()).not.toContain('Final IVT safety gates incomplete');
  });

  it('binds the separate EVT builder to exact canonical scores without inventing scalar values from bands', async () => {
    await page.evaluate(value => window.renderProtocols(value), complete);
    await page.locator('#evt-occlusion').evaluate(node => { for (let parent = node.parentElement; parent; parent = parent.parentElement) if (parent.tagName === 'DETAILS') parent.open = true; });
    expect(await page.locator('#evt-aspects').inputValue()).toBe('6-10');
    expect(await page.locator('#evt-prestroke-mrs').inputValue()).toBe('0-1');
    expect(await page.locator('#evt-pc-aspects-basilar').inputValue()).toBe('>=6');
    expect(await page.locator('#evt-aspects').isDisabled()).toBe(true);
    expect(await page.locator('#evt-prestroke-mrs').isDisabled()).toBe(true);
    expect(await page.locator('#evt-pc-aspects-basilar').isDisabled()).toBe(true);
    expect(await page.locator('#evt-nihss-basilar').evaluate(node => node.readOnly)).toBe(true);
    expect(await page.evaluate(() => window.calls)).toEqual([]);
    await page.locator('#evt-age').fill('73');
    await page.locator('#evt-ctp-core').fill('24');
    await page.locator('#evt-mass-effect').selectOption('present');
    expect(await page.evaluate(() => window.calls)).toEqual([['age', '73'], ['coreVolume', '24'], ['massEffect', true]]);
    await page.locator('#evt-occlusion').selectOption('lvo');
    await page.locator('#evt-time-window').selectOption('6-24');
    await page.locator('#evt-mismatch-ratio').fill('1.8');
    await page.evaluate(value => window.renderProtocols(value), { ...complete, ivt: { ...complete.ivt, hoursFromLKW: 1.02 } });
    expect(await page.locator('#evt-occlusion').inputValue()).toBe('lvo');
    expect(await page.locator('#evt-mismatch-ratio').inputValue()).toBe('1.8');
    const next = { ...complete, sourceKey: 'clear-source', anterior: { ...complete.anterior, aspectsScore: '', preMRS: '', nihss: '', coreVolume: '', massEffect: null }, basilar: { ...complete.basilar, pcAspects: '' } };
    await page.evaluate(value => window.renderProtocols(value), next);
    expect(await page.locator('#evt-occlusion').inputValue()).toBe('');
    expect(await page.locator('#evt-time-window').inputValue()).toBe('auto');
    expect(await page.locator('#evt-mismatch-ratio').inputValue()).toBe('');
    expect(await page.locator('#evt-aspects').inputValue()).toBe('');
    expect(await page.locator('#evt-prestroke-mrs').inputValue()).toBe('');
    expect(await page.locator('#evt-pc-aspects-basilar').inputValue()).toBe('');
    expect(await page.locator('#evt-nihss-basilar').inputValue()).toBe('');
    expect(await page.locator('#evt-mass-effect').inputValue()).toBe('');
  });

  it('projects an explicitly entered zero into the correct builder bands without hiding it', async () => {
    const value = { ...complete, anterior: { ...complete.anterior, aspectsScore: 0, preMRS: 0, nihss: 0, coreVolume: 0 }, basilar: { ...complete.basilar, pcAspects: 0 } };
    await page.evaluate(value => window.renderProtocols(value), value);
    expect(await page.locator('#evt-aspects').inputValue()).toBe('0-2');
    expect(await page.locator('#evt-prestroke-mrs').inputValue()).toBe('0-1');
    expect(await page.locator('#evt-pc-aspects-basilar').inputValue()).toBe('<6');
    expect(await page.locator('#evt-nihss-basilar').inputValue()).toBe('0');
    expect(await page.locator('#evt-ctp-core').inputValue()).toBe('0');
    expect(await page.evaluate(() => window.calls)).toEqual([]);
  });

  it.each(['', '   ', '0x5', '1e0', '1.5', '-1', '11', true, null])('does not turn invalid exact scores %j into a default or a band', async invalid => {
    const value = { ...complete, anterior: { ...complete.anterior, aspectsScore: invalid, preMRS: invalid, nihss: '' }, basilar: { ...complete.basilar, pcAspects: invalid } };
    await page.evaluate(value => window.renderProtocols(value), value);
    expect(await page.locator('#evt-aspects').inputValue()).toBe('');
    expect(await page.locator('#evt-prestroke-mrs').inputValue()).toBe('');
    expect(await page.locator('#evt-pc-aspects-basilar').inputValue()).toBe('');
    expect(await page.locator('#evt-nihss-basilar').inputValue()).toBe('');
  });

  it('shows a canonical mRS six without inventing a protocol tier or losing the exact value', async () => {
    await render({ ...complete, ivt: { ...complete.ivt, preMRS: 6 } });
    expect(await ivt().getByLabel('Baseline mRS').inputValue()).toBe('6');
    expect(await page.evaluate(() => window.calls)).toEqual([]);
  });

  it('retains standalone defaults and editable local fields when Encounter is absent', async () => {
    await render(null, { age: '65', weight: '80', nihss: 7, aspects: 9, hoursFromLKW: 2, hoursFromLKWh: 2, preMRS: 0 });
    expect(await ivt().getByLabel('Age', { exact: true }).inputValue()).toBe('65');
    expect(await evt().getByLabel('NIHSS', { exact: true }).inputValue()).toBe('7');
    expect(await evt().getByLabel('Pre-stroke mRS').inputValue()).toBe('0');
    expect(await evt().getByLabel('NIHSS', { exact: true }).evaluate(node => node.readOnly)).toBe(false);
    await evt().getByLabel('NIHSS', { exact: true }).fill('12');
    await ivt().getByLabel('LKW (h)', { exact: true }).fill('4.5');
    expect(await evt().getByLabel('NIHSS', { exact: true }).inputValue()).toBe('12');
    expect(await ivt().getByLabel('LKW (h)', { exact: true }).inputValue()).toBe('4.5');
    expect(await page.evaluate(() => window.calls)).toEqual([]);
  });
});
