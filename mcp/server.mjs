#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Stroke CDS — MCP server
//
// Exposes the institution-neutral stroke calculators + evidence atlas as
// agent-callable MCP tools (stdio transport). Wraps the SAME pure functions the
// web app uses (../src/calculators*.js) and reads the served data API (../data).
//
// NOT medical advice. Decision support for qualified clinicians; verify against
// primary sources and local policy. No hospital-specific content here.
//
// Run:   node mcp/server.mjs       (after `cd mcp && npm install`)
// Config: see mcp/README.md
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import {
  calculateTNKDose,
  calculateAlteplaseDose,
  calculatePCCDose,
  calculateAndexanetDose,
  calculateCrCl,
  calculateEnoxaparinDose,
  calculateDOACStart,
} from '../src/calculators.js';
import { evaluateDAWN, evaluateDEFUSE3 } from '../src/calculators-extended.js';

const DISCLAIMER =
  'Decision support only — not medical advice. Verify against primary sources and local policy.';

// ── load served data (atlas / guidelines / whats-new) ────────────────────────
function loadJson(rel, fallback) {
  try {
    return JSON.parse(fs.readFileSync(new URL(rel, import.meta.url), 'utf8'));
  } catch {
    return fallback;
  }
}
const completed = loadJson('../data/atlas/completed-trials.json', { data: [] }).data;
const active = loadJson('../data/atlas/active-trials.json', { data: [] }).data;
const guidelinesIndex = loadJson('../data/guidelines/index.json', { data: [] }).data;
const calculatorsIndex = loadJson('../data/calculators-index.json', { data: [] }).data;
const genericProtocols = loadJson('../data/generic-protocols.json', { data: {} }).data;
const whatsNew = loadJson('../whats-new.json', { items: [] });

const ok = (obj) => ({ content: [{ type: 'text', text: JSON.stringify({ ...obj, _disclaimer: DISCLAIMER }, null, 2) }] });
const text = (t) => ({ content: [{ type: 'text', text: t }] });

const server = new McpServer({ name: 'stroke-cds', version: '1.0.0' });

// ── Calculator tools (wrap the real functions) ───────────────────────────────
server.registerTool('calc_tnk_dose',
  { title: 'Tenecteplase dose', description: 'IV tenecteplase dose for AIS (0.25 mg/kg, max 25 mg). Input: weightKg.', inputSchema: { weightKg: z.number().positive().describe('Patient weight in kg') } },
  async ({ weightKg }) => ok({ tool: 'calc_tnk_dose', result: calculateTNKDose(weightKg) }));

server.registerTool('calc_alteplase_dose',
  { title: 'Alteplase dose', description: 'IV alteplase dose for AIS (0.9 mg/kg, max 90 mg; 10% bolus). Input: weightKg.', inputSchema: { weightKg: z.number().positive().describe('Patient weight in kg') } },
  async ({ weightKg }) => ok({ tool: 'calc_alteplase_dose', result: calculateAlteplaseDose(weightKg) }));

server.registerTool('calc_pcc_dose',
  { title: '4F-PCC dose', description: '4-factor PCC dose. Warfarin pathway is INR-stratified; FXa-inhibitor ICH uses fixed 50 IU/kg.', inputSchema: {
      weightKg: z.number().positive(),
      inr: z.number().optional().describe('INR (warfarin pathway only)'),
      indication: z.enum(['warfarin', 'fxa-ich', 'fxa-no-andexanet']).default('warfarin'),
    } },
  async ({ weightKg, inr, indication }) => ok({ tool: 'calc_pcc_dose', result: calculatePCCDose(weightKg, inr, indication) }));

server.registerTool('calc_andexanet_dose',
  { title: 'Andexanet alfa dose', description: 'Andexanet alfa dosing for FXa-inhibitor reversal.', inputSchema: {
      doacType: z.enum(['apixaban', 'rivaroxaban', 'edoxaban', 'other']),
      lastDoseHours: z.number().nonnegative().describe('Hours since last DOAC dose'),
      doacDoseMg: z.number().positive().describe('Last DOAC dose in mg'),
      thrombosisRisk: z.enum(['low', 'moderate', 'high']).default('moderate'),
    } },
  async ({ doacType, lastDoseHours, doacDoseMg, thrombosisRisk }) => ok({ tool: 'calc_andexanet_dose', result: calculateAndexanetDose(doacType, lastDoseHours, doacDoseMg, thrombosisRisk) }));

server.registerTool('calc_crcl',
  { title: 'Creatinine clearance', description: 'Cockcroft-Gault CrCl with obesity/AdjBW guidance for DOAC dosing.', inputSchema: {
      age: z.number().positive(), weight: z.number().positive(),
      sex: z.enum(['male', 'female']), creatinine: z.number().positive().describe('Serum creatinine mg/dL'),
      heightCm: z.number().positive().optional(),
    } },
  async ({ age, weight, sex, creatinine, heightCm }) => ok({ tool: 'calc_crcl', result: calculateCrCl(age, weight, sex, creatinine, heightCm) }));

server.registerTool('calc_enoxaparin_dose',
  { title: 'Enoxaparin dose', description: 'Renally-adjusted enoxaparin dose.', inputSchema: { weightKg: z.number().positive(), crCl: z.number().positive().describe('Creatinine clearance mL/min') } },
  async ({ weightKg, crCl }) => ok({ tool: 'calc_enoxaparin_dose', result: calculateEnoxaparinDose(weightKg, crCl) }));

server.registerTool('calc_doac_start_timing',
  { title: 'DOAC start timing (post-stroke AF)', description: 'When to (re)start a DOAC after AIS in AF, per ELAN/OPTIMAS-era guidance.', inputSchema: {
      nihss: z.number().nonnegative(),
      onsetDate: z.string().describe('Stroke onset date (ISO, e.g. 2026-06-19)'),
      protocol: z.enum(['elan-optimas', 'classic-1-3-6-12']).default('elan-optimas'),
      imagingSize: z.enum(['small', 'moderate', 'large']).nullable().optional(),
    } },
  async ({ nihss, onsetDate, protocol, imagingSize }) => ok({ tool: 'calc_doac_start_timing', result: calculateDOACStart(nihss, onsetDate, protocol, imagingSize ?? null) }));

server.registerTool('calc_dawn_eligibility',
  { title: 'DAWN EVT eligibility', description: 'DAWN trial clinical-core mismatch EVT eligibility (6-24h).', inputSchema: {
      age: z.number().positive(), nihss: z.number().nonnegative(),
      coreMl: z.number().nonnegative().describe('Infarct core volume (mL)'),
      timeFromLKWh: z.number().nonnegative().describe('Hours from last known well'),
    } },
  async (a) => ok({ tool: 'calc_dawn_eligibility', result: evaluateDAWN(a) }));

server.registerTool('calc_defuse3_eligibility',
  { title: 'DEFUSE-3 EVT eligibility', description: 'DEFUSE-3 perfusion-mismatch EVT eligibility (6-16h).', inputSchema: {
      coreMl: z.number().nonnegative(), penumbraMl: z.number().nonnegative(),
      timeFromLKWh: z.number().nonnegative(), nihss: z.number().nonnegative(), age: z.number().positive(),
    } },
  async (a) => ok({ tool: 'calc_defuse3_eligibility', result: evaluateDEFUSE3(a) }));

// ── Data / atlas tools ───────────────────────────────────────────────────────
server.registerTool('list_calculators',
  { title: 'List calculators', description: 'Catalog of available calculators (id, name, category).', inputSchema: {} },
  async () => ok({ count: calculatorsIndex.length, calculators: calculatorsIndex }));

server.registerTool('search_trials',
  { title: 'Search trials', description: 'Search the evidence atlas (landmark + active trials) by free-text query and optional status.', inputSchema: {
      query: z.string().describe('Free-text: trial name, topic, intervention'),
      status: z.enum(['completed', 'active', 'all']).default('all'),
      limit: z.number().int().positive().max(50).default(15),
    } },
  async ({ query, status, limit }) => {
    const q = query.toLowerCase();
    const pool = status === 'completed' ? completed : status === 'active' ? active : [...completed, ...active];
    const match = (t) => JSON.stringify(t).toLowerCase().includes(q);
    const hits = pool.filter(match).slice(0, limit).map((t) => ({ id: t.id, name: t.shortName || t.name || t.title, topic: t.topic || t.topicLabel, year: t.year, verificationStatus: t.verificationStatus }));
    return ok({ query, status, count: hits.length, trials: hits });
  });

server.registerTool('get_trial',
  { title: 'Get trial', description: 'Full record for one trial by id (completed or active).', inputSchema: { id: z.string() } },
  async ({ id }) => {
    const t = completed.find((x) => x.id === id) || active.find((x) => x.id === id);
    return t ? ok({ id, trial: t }) : text(`No trial with id "${id}".`);
  });

server.registerTool('list_guidelines',
  { title: 'List guidelines', description: 'Guideline metadata index (id, title, DOI, recommendation count).', inputSchema: {} },
  async () => ok({ count: guidelinesIndex.length, guidelines: guidelinesIndex }));

server.registerTool('get_guideline',
  { title: 'Get guideline', description: 'Full guideline (recommendations) by id, e.g. "ais-2026", "ich-2022".', inputSchema: { id: z.string() } },
  async ({ id }) => {
    const g = loadJson(`../data/guidelines/${id}.json`, null);
    return g ? ok({ id, guideline: g }) : text(`No guideline with id "${id}". Use list_guidelines for valid ids.`);
  });

server.registerTool('whats_new',
  { title: "What's new", description: 'Recent practice-changing evidence feed.', inputSchema: {
      verifiedOnly: z.boolean().default(true),
      limit: z.number().int().positive().max(50).default(15),
    } },
  async ({ verifiedOnly, limit }) => {
    let items = whatsNew.items || [];
    if (verifiedOnly) items = items.filter((i) => i.verificationStatus === 'verified');
    return ok({ count: items.length, items: items.slice(0, limit) });
  });

server.registerTool('generic_bp_protocols',
  { title: 'Generic BP protocols', description: 'Institution-neutral, evidence-based BP targets for AIS/ICH (pre/post lytic/EVT).', inputSchema: {} },
  async () => ok({ protocols: genericProtocols }));

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('stroke-cds MCP server running on stdio.');
