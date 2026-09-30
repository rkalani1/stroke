#!/usr/bin/env node
// Actual-transport contract regressions; synthetic inputs only, no network or PHI.
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import assert from 'node:assert/strict';

const client = new Client({ name: 'smoke', version: '1.0.0' });
await client.connect(new StdioClientTransport({ command: 'node', args: [new URL('./server.mjs', import.meta.url).pathname] }));
let calls = 0;
const called = new Set();
async function call(name, args = {}) {
  const response = await client.callTool({ name, arguments: args });
  calls++; called.add(name);
  assert.notEqual(response.isError, true, `${name}: ${response.content?.[0]?.text}`);
  const body = JSON.parse(response.content[0].text);
  assert.match(body._disclaimer, /Synthetic educational demo only/);
  return body;
}
async function rejects(name, args) {
  const response = await client.callTool({ name, arguments: args });
  calls++; called.add(name);
  assert.equal(response.isError, true, `${name} accepted malformed input ${JSON.stringify(args)}`);
}

try {
  const { tools } = await client.listTools();
  assert.equal(tools.length, 15);
  const tnk = (await call('calc_tnk_dose', { weightKg: 69 })).result;
  assert.equal(tnk.calculatedDose, '17.25');
  assert.equal(tnk.authority, 'guideline');
  assert.match(tnk.sourceUrl, /STR\.0000000000000513/);
  assert.equal((await call('calc_tnk_dose', { weightKg: 69, authority: 'fda-label' })).result.calculatedDose, '17.5');
  assert.equal((await call('calc_tnk_dose', { weightKg: 80 })).result.calculatedDose, '20');
  assert.equal((await call('calc_tnk_dose', { weightKg: 120 })).result.calculatedDose, '25');
  await rejects('calc_tnk_dose', { weightKg: '69abc' });
  await rejects('calc_tnk_dose', { weightKg: 351 });
  await rejects('calc_tnk_dose', { weightKg: 69, authority: 'unknown' });
  const alteplase = (await call('calc_alteplase_dose', { weightKg: 80 })).result;
  assert.equal(Number(alteplase.totalDose), 72);

  for (const args of [
    { weightKg: 80, inr: 5, indication: 'warfarin' },
    { indication: 'fxa-ich' },
    { indication: 'fxa-ich', directXaElevated: true, pccContraindicated: false },
    { indication: 'dabigatran-fallback', idarucizumabAvailable: false, pccContraindicated: false },
    { indication: 'fxa-no-andexanet', directXaElevated: true, pccContraindicated: false },
  ]) {
    const result = (await call('calc_pcc_dose', args)).result;
    assert.equal(result.actionable, false);
    assert.equal(result.ahaDose, null);
    assert.equal(result.fixedDose, false);
    assert.equal(result.rescue, undefined);
    assert.doesNotMatch(result.note, /give\s|2000|2,000|500 additional/i);
  }
  for (const inr of [0, -1]) await rejects('calc_pcc_dose', { inr });
  const andexanet = (await call('calc_andexanet_dose')).result;
  assert.equal(andexanet.actionable, false);
  assert.equal(andexanet.regimen, 'unavailable');
  assert(!andexanet.bolus && !andexanet.infusion && !andexanet.total);
  assert.equal(Object.hasOwn(andexanet, 'requiresElevatedDirectXaScreen'), false);
  assert.doesNotMatch(JSON.stringify(andexanet), /2000|2,000|give.*PCC|PCC.*units/i);
  assert.match(andexanet.scopeNote, /US/);

  for (const [sex, factor] of [['male', 1], ['female', 0.85]]) {
    const result = (await call('calc_crcl', { age: 70, weight: 80, sex, creatinine: 1 })).result;
    assert(result);
    assert(Math.abs(result.rawValue - 70 * 80 * factor / 72) < 1e-10);
  }
  const renalBoundary = (await call('calc_crcl', { age: 70, weight: 80, sex: 'male', creatinine: 2.596 })).result;
  assert.equal(renalBoundary.value, 30);
  assert(renalBoundary.rawValue < 30);
  const severe = (await call('calc_crcl', { age: 70, weight: 80, sex: 'male', creatinine: 5.19 })).result;
  assert.equal(severe.value, 15);
  assert(severe.rawValue < 15);
  assert.equal(severe.renalCategory, 'severe');
  assert.doesNotMatch(severe.label, /dialysis/i);
  for (const patch of [{ sex: 'M' }, { age: 10 }, { creatinine: '' }, { weight: [80] }, { heightCm: true }]) {
    await rejects('calc_crcl', { age: 70, weight: 80, sex: 'male', creatinine: 1, ...patch });
  }
  const enox = (await call('calc_enoxaparin_dose', { weightKg: 130, crCl: 50 })).result;
  assert.match(enox.prophylaxisNote, /40 mg SC daily/);
  assert.match(enox.prophylaxisNote, /does not automatically/);
  assert.match(enox.sourceUrl, /lovenox\.pdf$/);
  assert.equal((await call('calc_enoxaparin_dose', { weightKg: 80, crCl: renalBoundary.rawValue })).result.isRenalAdjusted, true);
  for (const crCl of [undefined, null]) {
    const result = (await call('calc_enoxaparin_dose', { weightKg: 80, crCl })).result;
    assert.equal(result.dose, null);
    assert.equal(result.crClUnknown, true);
  }
  await rejects('calc_enoxaparin_dose', { weightKg: 80, crCl: '' });
  await rejects('calc_enoxaparin_dose', { weightKg: 80, crCl: 0 });

  for (const protocol of ['elan-optimas', '1-3-6-12']) for (const onsetDate of ['2026-09-30', '2026-02-31', '1']) {
    const result = (await call('calc_doac_start_timing', { nihss: 30, onsetDate, protocol })).result;
    assert.equal(result.status, 'withheld'); assert.equal(result.actionable, false);
    assert.equal(result.days, null); assert.equal(result.startDate, null);
    assert.match(result.note, /not NIHSS/); assert.equal(result.sourceUrls.length, 3);
  }
  const dawn = (await call('calc_dawn_eligibility', { age: 70, nihss: 15, coreMl: 10, timeFromLKWh: 10 })).result;
  const defuse = (await call('calc_defuse3_eligibility', { age: 70, nihss: 15, coreMl: 10, penumbraMl: 30, timeFromLKWh: 10 })).result;
  for (const result of [dawn, defuse]) {
    assert.equal(result.eligible, null); assert.equal(result.partialScreenMet, true);
    assert.equal(result.actionable, false); assert.equal(result.missingDomains.length, 3);
  }
  assert.equal((await call('calc_dawn_eligibility', { age: 70, nihss: 15, coreMl: 10, timeFromLKWh: 2 })).result.eligible, false);
  await rejects('calc_dawn_eligibility', { age: 70, nihss: 15.5, coreMl: 10, timeFromLKWh: 10 });
  await rejects('calc_defuse3_eligibility', { age: 70, nihss: 15, coreMl: '10abc', penumbraMl: 30, timeFromLKWh: 10 });

  const guides = await call('list_guidelines');
  assert.equal(guides.count, 110);
  const aisIndex = guides.guidelines.find(g => g.id === 'ais-2026');
  assert.equal(aisIndex.coverageComplete, true);
  assert.equal(aisIndex.hasUnresolvedUpdates, true);
  assert(aisIndex.publicationUpdates.some(update => ['unresolved', 'partially-applied'].includes(update.status)));
  assert(guides.guidelines.every(g => g.sourceReview?.scope));
  const ncs = (await call('get_guideline', { id: 'ncs-reversal-2026' })).guideline;
  assert.match(ncs.sourceReview.sourceAccess, /Full primary publisher HTML/);
  assert(ncs.recommendations.length > 0);
  for (const id of ['../../package', '%2e%2e/%2e%2e/package', '../index', 'not-a-guideline']) {
    const body = await call('get_guideline', { id });
    assert.equal(body.guideline, null); assert.equal(body.status, 'not-found');
  }
  const trial = (await call('get_trial', { id: 'catalyst' })).trial;
  assert.equal(trial.id, 'catalyst');
  assert.match(trial.verificationNotes, /no exhaustive/);
  assert((await call('search_trials', { query: 'thrombectomy', limit: 5 })).count > 0);
  assert((await call('list_calculators')).count >= 20);
  const bp = await call('generic_bp_protocols');
  assert.equal(bp.protocols, null); assert.equal(bp.actionable, false);
  assert.doesNotMatch(JSON.stringify(bp), /SBP 140-180|2,000|2000 units|MINUTE.*priority/);
  assert.equal(called.size, tools.length, 'every registered tool exercised');
  console.log(`SMOKE OK: ${calls} actual tool calls across all ${called.size} tools; reviewed boundaries, withheld outputs and path allowlist verified.`);
} finally {
  await client.close();
}
