#!/usr/bin/env node
// Smoke test: spawn the stroke-cds MCP server, list tools, call a few, assert sane output.
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({ command: 'node', args: [new URL('./server.mjs', import.meta.url).pathname] });
const client = new Client({ name: 'smoke', version: '1.0.0' });
await client.connect(transport);

let failures = 0;
const assert = (cond, msg) => { if (!cond) { failures++; console.error('  ✗ ' + msg); } else { console.log('  ✓ ' + msg); } };

const { tools } = await client.listTools();
console.log(`Tools (${tools.length}): ${tools.map((t) => t.name).join(', ')}`);
assert(tools.length >= 15, 'at least 15 tools registered');
assert(tools.some((t) => t.name === 'calc_tnk_dose'), 'calc_tnk_dose present');
assert(tools.some((t) => t.name === 'search_trials'), 'search_trials present');

async function call(name, args) {
  const r = await client.callTool({ name, arguments: args });
  return JSON.parse(r.content[0].text);
}

const tnk = await call('calc_tnk_dose', { weightKg: 80 });
console.log('  calc_tnk_dose(80kg) →', JSON.stringify(tnk.result));
assert(tnk.result && parseFloat(tnk.result.calculatedDose) === 20, 'TNK 80kg → 20 mg (0.25 mg/kg)');

const tnkMax = await call('calc_tnk_dose', { weightKg: 120 });
assert(parseFloat(tnkMax.result.calculatedDose) === 25 && tnkMax.result.isMaxDose, 'TNK 120kg capped at 25 mg');

const pccWarfarin = await call('calc_pcc_dose', { weightKg: 80, inr: 5, indication: 'warfarin' });
assert(pccWarfarin.result.ahaDose === 2000 && pccWarfarin.result.iuPerKg === null, 'warfarin PCC is fixed at 2,000 units');

for (const inr of [0, -1]) {
  const invalidPccInr = await client.callTool({
    name: 'calc_pcc_dose',
    arguments: { weightKg: 80, inr, indication: 'warfarin' },
  });
  assert(invalidPccInr.isError === true, `warfarin PCC rejects INR ${inr}`);
}

const pccFxaPending = await call('calc_pcc_dose', { indication: 'fxa-ich' });
assert(pccFxaPending.result.ahaDose === null && pccFxaPending.result.recommendation === 'pending-required-gates', 'FXa PCC fails closed without both source-listed gates');

const pccFxaReady = await call('calc_pcc_dose', {
  indication: 'fxa-ich',
  directXaElevated: true,
  pccContraindicated: false,
});
assert(pccFxaReady.result.ahaDose === 2000 && pccFxaReady.result.recommendation === 'give-fixed-dose', 'FXa PCC returns 2,000 units only after both gates');

const pccDabigatran = await call('calc_pcc_dose', {
  indication: 'dabigatran-fallback',
  idarucizumabAvailable: false,
  pccContraindicated: false,
});
assert(pccDabigatran.result.ahaDose === 2000 && pccDabigatran.result.recommendation === 'give-fixed-dose-fallback', 'dabigatran fallback PCC returns 2,000 units only after both gates');

const pccDabigatranContraindicated = await call('calc_pcc_dose', {
  indication: 'dabigatran-fallback',
  idarucizumabAvailable: false,
  pccContraindicated: true,
});
assert(
  pccDabigatranContraindicated.result.ahaDose === null
    && pccDabigatranContraindicated.result.fixedDose === false
    && pccDabigatranContraindicated.result.recommendation === 'pending-required-gates',
  'dabigatran fallback PCC remains non-actionable when PCC is contraindicated',
);
assert(!/give\s+4F-PCC\s+2000/i.test(pccDabigatranContraindicated.result.inrTierNote || ''), 'pending dabigatran fallback emits no affirmative PCC dose text');

const andexanet = await call('calc_andexanet_dose', {});
assert(andexanet.result.regimen === 'unavailable' && andexanet.result.actionable === false, 'andexanet remains unavailable and non-actionable');
assert(!andexanet.result.bolus && !andexanet.result.infusion && !andexanet.result.total, 'andexanet returns no dose components');

const trials = await call('search_trials', { query: 'thrombectomy', limit: 5 });
console.log(`  search_trials("thrombectomy") → ${trials.count} hits`);
assert(trials.count > 0, 'search_trials returns hits');

const guides = await call('list_guidelines', {});
assert(guides.count >= 15, `list_guidelines → ${guides.count} guidelines`);

const cals = await call('list_calculators', {});
assert(cals.count >= 20, `list_calculators → ${cals.count} calculators`);

await client.close();
console.log(failures ? `\nSMOKE FAILED (${failures})` : '\nSMOKE OK');
process.exit(failures ? 1 : 0);
