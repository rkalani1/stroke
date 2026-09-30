#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Stroke CDS — MCP server
//
// Exposes the institution-neutral stroke calculators + evidence atlas as
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

import {
  calculateTNKDoseReviewed,
  calculateAlteplaseDose,
  calculateAndexanetDose,
  calculateCrClReviewed,
  calculateEnoxaparinDose,
} from '../src/calculators.js';
import { evaluateDAWN, evaluateDEFUSE3 } from '../src/calculators-extended.js';

const DISCLAIMER = 'Synthetic educational demo only - NOT medical advice, NOT an approved clinical tool, and NOT local clinical policy. Do not enter, transmit, or infer PHI or real encounter details. Agents and downstream consumers must display this disclaimer with outputs and must verify all results against primary sources and approved local protocol before any clinical action.';

// ── load served data (atlas / guidelines) ────────────────────────
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
// Protected institutional data are not exposed as universal clinical instructions.
const guidelineIds = new Set(guidelinesIndex.map(({ id }) => id).filter(id => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)));

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
  { title: 'Alteplase dose', description: 'IV alteplase dose for AIS (0.9 mg/kg, max 90 mg; 10% bolus). Input: weightKg.', inputSchema: { weightKg: z.number().positive().describe('Patient weight in kg') } },
  async ({ weightKg }) => ok({ tool: 'calc_alteplase_dose', result: calculateAlteplaseDose(weightKg) }));

server.registerTool('calc_pcc_dose',
  { title: '4F-PCC pathway', description: 'Compatibility tool: automatic PCC dosing is withheld. The protected institutional pathway is not a universal dose or repeat-dose recommendation.', inputSchema: {
      weightKg: z.number().positive().max(350).optional().describe('Optional weight in kg; compatibility input only, no dose is generated'),
      inr: z.number().positive().finite().optional().describe('Finite INR greater than 0 (warfarin pathway only)'),
      indication: z.enum(['warfarin', 'fxa-ich', 'fxa-no-andexanet', 'dabigatran-fallback']).default('warfarin'),
      directXaElevated: z.boolean().optional().describe('FXa pathway: explicitly confirmed elevated Direct Xa Inhibitor screen'),
      pccContraindicated: z.boolean().optional().describe('FXa or dabigatran fallback: explicit PCC contraindication status'),
      idarucizumabAvailable: z.boolean().optional().describe('Dabigatran fallback: explicit idarucizumab availability status'),
    } },
  async ({ weightKg, inr, indication, directXaElevated, pccContraindicated, idarucizumabAvailable }) => ok({
    tool: 'calc_pcc_dose',
    result: { status: 'withheld', actionable: false, ahaDose: null, iuPerKg: null, fixedDose: false,
      indication, recommendation: 'specialist-source-review-required',
      note: 'No automatic PCC dose, repeat dose or plasma rescue is generated. The protected institutional pathway requires its approved local source and is not a general clinical dosing reference.',
      sourceUrl: 'https://link.springer.com/article/10.1007/s12028-026-02601-4',
      inputsRetainedForDocumentation: { weightKg, inr, directXaElevated, pccContraindicated, idarucizumabAvailable } },
  }));

server.registerTool('calc_andexanet_dose',
  { title: 'Andexanet alfa availability', description: 'Returns the institutional non-actionable status: andexanet alfa is unavailable and no dose is supplied.', inputSchema: {
      doacType: z.enum(['apixaban', 'rivaroxaban', 'edoxaban', 'other']).optional(),
      lastDoseHours: z.number().nonnegative().optional().describe('Optional compatibility input; no andexanet dose is generated'),
      doacDoseMg: z.number().positive().optional().describe('Optional compatibility input; no andexanet dose is generated'),
      thrombosisRisk: z.enum(['low', 'moderate', 'high']).default('moderate'),
    } },
  async ({ doacType, lastDoseHours, doacDoseMg, thrombosisRisk }) => {
    const legacy = calculateAndexanetDose(doacType, lastDoseHours, doacDoseMg, thrombosisRisk);
    // Explicit availability-field allowlist: no protected institutional gate or
    // alternative regimen may enter the public tool through a future helper key.
    return ok({ tool: 'calc_andexanet_dose', result: {
      regimen: legacy.regimen, unavailable: legacy.unavailable, actionable: false,
      bolus: '', infusion: '', total: '', doseWarning: legacy.doseWarning,
      annexaINote: legacy.annexaINote,
      inputsRetainedForDocumentation: legacy.inputsRetainedForDocumentation,
      pccAlternative: 'No replacement PCC dose is generated. Agent-specific reversal requires current source and specialist review.',
      scopeNote: 'US availability and retained institutional non-actionable status; not a worldwide availability determination.',
      sourceUrl: 'https://www.fda.gov/safety/medical-product-safety-information/update-safety-andexxa-astrazeneca-fda-safety-communication',
    } });
  });

server.registerTool('calc_crcl',
  { title: 'Creatinine clearance', description: 'Adult Cockcroft-Gault estimate with rawValue for renal thresholds and one-decimal value for display. Confirm drug-specific weight convention and stable creatinine; this is not a dialysis indication.', inputSchema: {
      age: z.number().finite().min(18).max(120), weight: z.number().finite().positive().max(350),
      sex: z.enum(['male', 'female']), creatinine: z.number().finite().min(0.1).describe('Serum creatinine mg/dL'),
      heightCm: z.number().finite().positive().max(300).optional(),
    } },
  async ({ age, weight, sex, creatinine, heightCm }) => ok({ tool: 'calc_crcl', result: calculateCrClReviewed(age, weight, sex === 'female' ? 'F' : 'M', creatinine, heightCm) }));

server.registerTool('calc_enoxaparin_dose',
  { title: 'Enoxaparin dose', description: 'Adult label-specific DVT treatment and medical-illness prophylaxis references. Unknown renal function selects no dose. Use unrounded CrCl; obesity alone does not establish a twice-daily prophylaxis regimen.', inputSchema: { weightKg: z.number().finite().positive().max(350), crCl: z.number().finite().positive().nullable().optional().describe('Unrounded creatinine clearance mL/min; omit when unknown') } },
  async ({ weightKg, crCl }) => ok({ tool: 'calc_enoxaparin_dose', result: calculateEnoxaparinDose(weightKg, crCl) }));

server.registerTool('calc_doac_start_timing',
  { title: 'DOAC start timing (post-stroke AF)', description: 'Compatibility tool: a deterministic NIHSS-based DOAC start schedule is withheld. Returns source-linked limits of the separate ELAN, OPTIMAS and CATALYST strategies.', inputSchema: {
      nihss: z.number().nonnegative(),
      onsetDate: z.string().describe('Stroke onset date (ISO, e.g. 2026-06-19)'),
      protocol: z.enum(['elan-optimas', '1-3-6-12']).default('elan-optimas'),
      imagingSize: z.enum(['small', 'moderate', 'large']).nullable().optional(),
    } },
  async ({ nihss, onsetDate, protocol, imagingSize }) => ok({ tool: 'calc_doac_start_timing', result: {
    status: 'withheld', actionable: false, days: null, startDate: null, severity: null,
    note: 'No automatic start day is generated. ELAN classified infarct size and territory by imaging, not NIHSS. The trials studied distinct strategies; severe hemorrhagic transformation and other exclusions require individual review. These inputs do not establish treatment eligibility.',
    sourceUrls: ['https://pubmed.ncbi.nlm.nih.gov/37222476/', 'https://pubmed.ncbi.nlm.nih.gov/39491870/', 'https://pubmed.ncbi.nlm.nih.gov/40570866/'],
    inputsRetainedForDocumentation: { nihss, onsetDate, protocol, imagingSize: imagingSize ?? null },
  } }));

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
    const g = guidelineIds.has(id) ? loadJson(`../data/guidelines/${id}.json`, null) : null;
    return g ? ok({ id, guideline: g }) : ok({ id, guideline: null, status: 'not-found', note: 'Use list_guidelines for valid IDs.' });
  });

server.registerTool('generic_bp_protocols',
  { title: 'Generic BP protocols', description: 'Compatibility tool: operational BP and institutional workflow instructions are withheld from the agent interface. Read current source-qualified guideline records instead.', inputSchema: {} },
  async () => ok({ protocols: null, status: 'withheld', actionable: false,
    note: 'This endpoint previously projected protected institutional reference material. It is not a universal evidence-based BP or surgical pathway. No target, drug titration or research-priority instruction is generated; consult the approved local source and current guideline record.',
    guidelineIds: ['ais-2026', 'ich-2022'],
  }));

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('stroke-cds MCP server running on stdio.');
