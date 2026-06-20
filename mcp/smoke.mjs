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
