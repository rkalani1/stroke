#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Stroke CDS — MCP server
//
// Exposes the institution-neutral stroke retained calculations + bounded sources as
// agent-callable MCP tools (stdio transport). Wraps the SAME pure functions the
// web app uses (../src/calculators*.js) and reads the served data API (../data).
//
// Synthetic educational demo only. Not medical advice; do not use for real
// encounters or PHI. Verify against primary sources and approved local protocol.
//
// Run:   node mcp/server.mjs       (after `cd mcp && npm install`)
// Config: see mcp/README.md
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { calculateTNKDoseReviewed, calculateAlteplaseDoseReviewed, calculateCrClReviewed } from '../src/calculators.js';
import { evaluateDAWN, evaluateDEFUSE3 } from '../src/calculators-extended.js';
import { searchReference } from '../src/reference-search.js';
import { validateClinicalReference } from '../scripts/validate-reference.mjs';

const DISCLAIMER = 'Synthetic educational demo only - NOT medical advice, NOT an approved clinical tool, and NOT local clinical policy. Do not enter, transmit, or infer PHI or real encounter details. Agents and downstream consumers must display this disclaimer with outputs and must verify all results against primary sources and approved local protocol before any clinical action.';

// Maintained static data must exist; fail startup rather than silently serve an empty corpus.
const readData = rel => JSON.parse(fs.readFileSync(new URL(rel, import.meta.url), 'utf8'));
const calculatorsIndex = readData('../data/calculators-index.json').data;
const maintainedSources = readData('../data/sources.json');
const clinicalReference = readData('../data/clinical-reference.json');
const appVersion = readData('../package.json').version;
const referenceErrors = validateClinicalReference(clinicalReference.data);
if (clinicalReference._meta?.status !== 'maintained' || clinicalReference._meta?.schemaVersion !== '2.0.0' || clinicalReference._meta?.appVersion !== appVersion || referenceErrors.length) {
  throw new Error(`Invalid or stale clinical-reference endpoint; run npm run agent:assets. ${referenceErrors.join('; ')}`);
}
const referenceRecords = [
  ...clinicalReference.data.topics.map(record => ({ ...record, type: 'topic' })),
  ...clinicalReference.data.studies.map(record => ({ ...record, type: 'study' })),
];

function partialTrialScreen(result, sourceUrl) {
  if (!result) return null;
  return { ...result, eligible: result.eligible ? null : false, partialScreenMet: result.eligible,
    status: result.eligible ? 'partial-screen-met' : 'modeled-criteria-not-met',
    actionable: false, eligibilityScope: 'Partial historical trial screen; not complete enrollment or EVT eligibility.',
    missingDomains: ['ICA/proximal MCA occlusion', 'Premorbid functional status', 'Remaining original trial inclusion/exclusion criteria'], sourceUrl };
}

const ok = (obj) => ({ content: [{ type: 'text', text: JSON.stringify({ ...obj, _disclaimer: DISCLAIMER }, null, 2) }] });
const text = (t) => ({ content: [{ type: 'text', text: t }] });

const server = new McpServer({ name: 'stroke-cds', version: '1.0.0' });

// ── Calculator tools (wrap the real functions) ───────────────────────────────
server.registerTool('calc_tnk_dose',
  { title: 'Tenecteplase dose', description: 'Adult AIS tenecteplase dose reference. Explicit authority: guideline 0.25 mg/kg (max 25 mg, default) or US FDA-label weight bands. Neither establishes IVT eligibility.', inputSchema: { weightKg: z.number().finite().positive().max(350).describe('Patient weight in kg'), authority: z.enum(['guideline', 'fda-label']).default('guideline') } },
  async ({ weightKg, authority }) => ok({ tool: 'calc_tnk_dose', result: calculateTNKDoseReviewed(weightKg, authority) }));

server.registerTool('calc_alteplase_dose',
  { title: 'Alteplase dose', description: 'IV alteplase dose for AIS (0.9 mg/kg, max 90 mg; 10% bolus). Input: weightKg.', inputSchema: { weightKg: z.number().finite().positive().max(350).describe('Synthetic weight in kg') } },
  async ({ weightKg }) => ok({ tool: 'calc_alteplase_dose', result: calculateAlteplaseDoseReviewed(weightKg) }));

server.registerTool('calc_crcl',
  { title: 'Creatinine clearance', description: 'Adult Cockcroft-Gault estimate with rawValue for renal thresholds and one-decimal value for display. Confirm drug-specific weight convention and stable creatinine; this is not a dialysis indication.', inputSchema: {
      age: z.number().finite().min(18).max(120), weight: z.number().finite().positive().max(350),
      sex: z.enum(['male', 'female']), creatinine: z.number().finite().min(0.1).describe('Serum creatinine mg/dL'),
      heightCm: z.number().finite().positive().max(300).optional(),
    } },
  async ({ age, weight, sex, creatinine, heightCm }) => ok({ tool: 'calc_crcl', result: calculateCrClReviewed(age, weight, sex === 'female' ? 'F' : 'M', creatinine, heightCm) }));

server.registerTool('calc_dawn_eligibility',
  { title: 'DAWN EVT eligibility', description: 'Partial DAWN age/NIHSS/core/time screen (6–24h), not complete EVT eligibility. A positive partial screen returns eligible:null.', inputSchema: {
      age: z.number().finite().positive().max(120), nihss: z.number().int().min(0).max(42),
      coreMl: z.number().nonnegative().describe('Infarct core volume (mL)'),
      timeFromLKWh: z.number().nonnegative().describe('Hours from last known well'),
    } },
  async (a) => ok({ tool: 'calc_dawn_eligibility', result: partialTrialScreen(evaluateDAWN(a), 'https://pubmed.ncbi.nlm.nih.gov/29129157/') }));

server.registerTool('calc_defuse3_eligibility',
  { title: 'DEFUSE-3 EVT eligibility', description: 'Partial DEFUSE-3 age/NIHSS/perfusion/time screen (6–16h), not complete EVT eligibility. penumbraMl is the legacy name for TOTAL Tmax>6s hypoperfused volume, including core. A positive partial screen returns eligible:null.', inputSchema: {
      coreMl: z.number().nonnegative(), penumbraMl: z.number().nonnegative(),
      timeFromLKWh: z.number().finite().nonnegative(), nihss: z.number().int().min(0).max(42), age: z.number().finite().positive().max(120),
    } },
  async (a) => ok({ tool: 'calc_defuse3_eligibility', result: partialTrialScreen(evaluateDEFUSE3(a), 'https://pubmed.ncbi.nlm.nih.gov/29364767/') }));

// ── Maintained tool metadata ───────────────────────────────────────────────────────
server.registerTool('list_calculators',
  { title: 'List calculators', description: 'Catalog of available calculators (id, name, category).', inputSchema: {} },
  async () => ok({ count: calculatorsIndex.length, calculators: calculatorsIndex }));

server.registerTool('get_sources',
 { title: 'Maintained sources and limits', description: 'Bounded retained source identities, original review scopes and correction limitations. No full reference corpus or recruitment data.', inputSchema: {} },
 async () => ok({ sources: maintainedSources.data, metadata: maintainedSources._meta }));

server.registerTool('search_reference',
  { title: 'Search Evidence and completed studies', description: 'Search the bounded local Evidence topics and completed primary-study summaries. Returns source-access scope and limitations. This does not fetch sources, screen enrollment or establish treatment eligibility.', inputSchema: {
    query: z.string().max(200).default('').describe('Words matched locally across the card and source titles; no patient details'),
    type: z.enum(['all', 'topic', 'study']).default('all'),
    setting: z.enum(['all', 'on-call', 'hospital', 'clinic']).default('all'),
    limit: z.number().int().min(1).max(25).default(10),
  } },
  async ({ query, type, setting, limit }) => {
    const matches = searchReference(referenceRecords.filter(record => type === 'all' || record.type === type), query, setting);
    return ok({ query, type, setting, count: Math.min(matches.length, limit), totalMatched: matches.length, truncated: matches.length > limit, records: matches.slice(0, limit), metadata: clinicalReference._meta });
  });

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('stroke-cds MCP server running on stdio.');
