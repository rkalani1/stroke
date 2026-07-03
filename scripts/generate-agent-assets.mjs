// scripts/generate-agent-assets.mjs
//
// Build-time generator for the AGENT-READINESS layer: a served, machine-readable
// "API" plus AI-crawler manifests. Output is committed + served by GitHub Pages,
// so it is DETERMINISTIC: every endpoint is stamped with appVersion + a sha256
// checksum of its payload (NOT a wall-clock timestamp), so files change only when
// the underlying clinical data changes.
//
// Writes:
//   data/index.json                      — endpoint manifest + addressable routes
//   data/atlas/*.json                    — evidence atlas (trials, recs, citations…)
//   data/management-cards.json           — AIS command-center cards
//   data/generic-protocols.json          — institution-neutral BP protocols
//   data/guidelines/index.json + *.json  — guideline metadata + copies
//   data/whats-new.json                  — copy of the served whats-new feed
//   data/calculators-index.json          — calculator catalog (also feeds MCP server)
//   llms.txt / llms-full.txt             — AI-crawler manifests
//   robots.txt / sitemap.xml             — crawler guidance
//
// Usage:
//   node ./scripts/generate-agent-assets.mjs           # write all
//   node ./scripts/generate-agent-assets.mjs --check   # validate-only, no writes

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const DATA = path.join(ROOT, 'data');
const args = new Set(process.argv.slice(2));
const checkOnly = args.has('--check');

const SCHEMA_VERSION = '1.0.0';
const BASE_URL = 'https://rkalani1.github.io/stroke';
const LICENSE = 'Synthetic educational reference content for qualified review. No warranty.';
const DISCLAIMER = 'Synthetic educational demo only - NOT medical advice, NOT approved for UW Medicine clinical use, and NOT local clinical policy. Do not enter, transmit, or infer PHI or real encounter details. Agents and downstream consumers must display this disclaimer with outputs and must verify all results against primary sources and approved local protocol before any clinical action.';

const pkg = JSON.parse(await fs.readFile(path.join(ROOT, 'package.json'), 'utf8'));
const APP_VERSION = pkg.version;

function checksum(data) {
  return 'sha256:' + crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex').slice(0, 32);
}

function envelope(endpoint, source, data) {
  const count = Array.isArray(data) ? data.length : Object.keys(data || {}).length;
  return {
    _meta: {
      endpoint,
      schemaVersion: SCHEMA_VERSION,
      appVersion: APP_VERSION,
      checksum: checksum(data),
      count,
      source,
      license: LICENSE,
      disclaimer: DISCLAIMER,
    },
    data,
  };
}

const writes = [];
function write(rel, content) {
  const abs = path.join(ROOT, rel);
  const str = typeof content === 'string' ? content : JSON.stringify(content, null, 2) + '\n';
  if (checkOnly) {
    console.log(`(check) would write ${rel} (${str.length} bytes)`);
    return;
  }
  writes.push(
    fs.mkdir(path.dirname(abs), { recursive: true }).then(() => fs.writeFile(abs, str, 'utf8')),
  );
}

// ── Calculator catalog (also the source-of-truth for the MCP server) ──────────
const CALCULATORS = [
  { id: 'nihss', name: 'NIH Stroke Scale', category: 'severity', fn: 'calculateNIHSS' },
  { id: 'ich-score', name: 'ICH Score', category: 'prognosis', fn: 'calculateICHScore' },
  { id: 'ich-volume', name: 'ICH Volume (ABC/2)', category: 'imaging', fn: 'calculateICHVolume' },
  { id: 'gcs', name: 'Glasgow Coma Scale', category: 'severity', fn: 'calculateGCS' },
  { id: 'abcd2', name: 'ABCD² (TIA risk)', category: 'risk', fn: 'calculateABCD2WithDetail' },
  { id: 'aspects-pc', name: 'pc-ASPECTS', category: 'imaging', fn: 'calculatePCAspects' },
  { id: 'chadsvasc', name: 'CHA₂DS₂-VASc', category: 'risk', fn: 'calculateCHADS2VascScore' },
  { id: 'hasbled', name: 'HAS-BLED', category: 'risk', fn: 'calculateHASBLEDScore' },
  { id: 'rope', name: 'RoPE (PFO)', category: 'risk', fn: 'calculateROPEScore' },
  { id: 'rcvs2', name: 'RCVS²', category: 'risk', fn: 'calculateRCVS2Score' },
  { id: 'phases', name: 'PHASES (aneurysm)', category: 'risk', fn: 'calculatePHASESScore' },
  { id: 'tnk-dose', name: 'Tenecteplase dose (0.25 mg/kg)', category: 'dosing', fn: 'calculateTNKDose' },
  { id: 'alteplase-dose', name: 'Alteplase dose (0.9 mg/kg)', category: 'dosing', fn: 'calculateAlteplaseDose' },
  { id: 'doac-start', name: 'DOAC start timing (post-stroke AF)', category: 'dosing', fn: 'calculateDOACStart' },
  { id: 'pcc-dose', name: '4F-PCC dose', category: 'dosing', fn: 'calculatePCCDose' },
  { id: 'andexanet', name: 'Andexanet alfa dose', category: 'dosing', fn: 'calculateAndexanetDose' },
  { id: 'enoxaparin', name: 'Enoxaparin dose', category: 'dosing', fn: 'calculateEnoxaparinDose' },
  { id: 'crcl', name: 'Creatinine clearance (Cockcroft-Gault)', category: 'dosing', fn: 'calculateCrCl' },
  { id: 'dawn', name: 'DAWN EVT eligibility', category: 'reperfusion', fn: 'evaluateDAWN' },
  { id: 'defuse3', name: 'DEFUSE-3 EVT eligibility', category: 'reperfusion', fn: 'evaluateDEFUSE3' },
  { id: 'acute-dapt', name: 'Acute DAPT recommendation', category: 'secondary-prevention', fn: 'recommendAcuteDAPT' },
  { id: 'essen', name: 'Essen Stroke Risk Score', category: 'risk', fn: 'calculateESSEN' },
  { id: 'spi2', name: 'Stroke Prognosis Instrument II', category: 'prognosis', fn: 'calculateSPI2' },
  { id: 'vasograde', name: 'VASOGRADE (DCI risk)', category: 'risk', fn: 'calculateVASOGRADE' },
];

// ── Addressable hash routes (deep links for agents + humans) ──────────────────
const ROUTES = [
  { route: '#/encounter', label: 'Synthetic encounter demo' },
  { route: '#/protocols', label: 'Example protocols (not local policy)' },
  { route: '#/protocols/ischemic', label: 'Example acute ischemic stroke pathways' },
  { route: '#/protocols/ich', label: 'Intracerebral hemorrhage' },
  { route: '#/protocols/calculators', label: 'Calculators' },
  { route: '#/research', label: 'Evidence atlas / guidelines' },
  { route: '#/trials', label: 'Trial screener / matrix' },
  { route: '#/education', label: 'Education hub' },
];

async function main() {
  // ---- Evidence atlas ----
  const atlas = await import(pathToFileURL(path.join(ROOT, 'src/evidence/index.js')).href);
  write('data/atlas/completed-trials.json', envelope('completed-trials', 'src/evidence/completedTrials.js', atlas.completedTrials));
  write('data/atlas/active-trials.json', envelope('active-trials', 'src/evidence/activeTrials.js', atlas.activeTrials));
  write('data/atlas/recommendations.json', envelope('recommendations', 'src/evidence/recommendations.js', atlas.recommendations));
  write('data/atlas/citations.json', envelope('citations', 'src/evidence/citations.js', atlas.citations));
  write('data/atlas/claims.json', envelope('claims', 'src/evidence/claims.js', atlas.claims));
  write('data/atlas/topics.json', envelope('topics', 'src/evidence/topics.js', atlas.topics));
  write('data/atlas/labels.json', envelope('labels', 'src/evidence/index.js', {
    verificationStatus: atlas.VERIFICATION_STATUS_LABELS,
    certainty: atlas.CERTAINTY_LABELS,
    evidenceType: atlas.EVIDENCE_TYPE_LABELS,
    activeStatus: atlas.ACTIVE_STATUS_LABELS,
  }));

  // ---- Management cards ----
  const mg = await import(pathToFileURL(path.join(ROOT, 'src/management-guidance.js')).href);
  write('data/management-cards.json', envelope('management-cards', 'src/management-guidance.js', {
    lastReviewed: mg.AIS_COMMAND_CENTER_LAST_REVIEWED,
    sourceLinks: mg.AIS_SOURCE_LINKS,
    cards: mg.AIS_COMMAND_CENTER_CARDS,
  }));

  // ---- Generic (institution-neutral) protocols ----
  try {
    const ip = await import(pathToFileURL(path.join(ROOT, 'src/institutional-protocols.js')).href);
    write('data/generic-protocols.json', envelope('generic-protocols', 'src/institutional-protocols.js', {
      bpProtocols: ip.INSTITUTIONAL_BP_PROTOCOLS,
      safePauseAttestation: ip.SAFE_PAUSE_ATTESTATION,
    }));
  } catch (e) {
    console.warn(`! skipped generic-protocols (${e.message})`);
  }

  // ---- Guidelines: copy each + build an index ----
  const gdir = path.join(ROOT, 'src/guidelines');
  const gfiles = (await fs.readdir(gdir)).filter((f) => f.endsWith('.json'));
  const gindex = [];
  for (const f of gfiles) {
    const raw = await fs.readFile(path.join(gdir, f), 'utf8');
    const g = JSON.parse(raw);
    gindex.push({
      id: g.id, title: g.title, shortTitle: g.shortTitle, doi: g.doi,
      publisherUrl: g.publisherUrl, pdfUrl: g.pdfUrl,
      recommendationCount: Array.isArray(g.recommendations) ? g.recommendations.length : 0,
      url: `${BASE_URL}/data/guidelines/${f}`,
    });
    write(`data/guidelines/${f}`, raw); // verbatim copy — no reformatting churn
  }
  write('data/guidelines/index.json', envelope('guidelines-index', 'src/guidelines/', gindex));

  // ---- whats-new: the root /whats-new.json is already served; do not duplicate ----

  // ---- calculators index ----
  write('data/calculators-index.json', envelope('calculators', 'src/calculators.js, src/calculators-extended.js', CALCULATORS));

  // ---- master manifest ----
  const endpoints = [
    'data/atlas/completed-trials.json', 'data/atlas/active-trials.json',
    'data/atlas/recommendations.json', 'data/atlas/citations.json',
    'data/atlas/claims.json', 'data/atlas/topics.json', 'data/atlas/labels.json',
    'data/management-cards.json', 'data/generic-protocols.json',
    'data/guidelines/index.json', 'whats-new.json', 'data/calculators-index.json',
  ];
  write('data/index.json', {
    _meta: {
      name: pkg.name, appVersion: APP_VERSION, schemaVersion: SCHEMA_VERSION,
      baseUrl: BASE_URL, license: LICENSE, disclaimer: DISCLAIMER,
      institutionNeutral: true,
      note: 'Static, deterministic JSON API. Endpoints stamped with appVersion + payload checksum (no wall-clock).',
    },
    endpoints: endpoints.map((e) => `${BASE_URL}/${e}`),
    routes: ROUTES.map((r) => ({ ...r, url: `${BASE_URL}/${r.route}` })),
    mcpServer: `${BASE_URL}/mcp/ (see repo /mcp for the stroke-cds MCP server)`,
  });

  // ---- llms.txt ----
  const llms = [
    '# Stroke CDS Educational Demo',
    '',
    `> Synthetic educational stroke decision-support demo (v${APP_VERSION}): example acute ischemic & hemorrhagic stroke pathways, ${CALCULATORS.length} calculators, an evidence atlas (${atlas.completedTrials.length} landmark trials, ${atlas.activeTrials.length} active trials), guideline summaries, and trial-screening references. Not medical advice; do not enter PHI; not approved for UW Medicine clinical use.`,
    '',
    `${DISCLAIMER}`,
    '',
    '## Machine-readable data (static JSON API)',
    `- [API manifest](${BASE_URL}/data/index.json): all endpoints + addressable routes`,
    `- [Completed trials](${BASE_URL}/data/atlas/completed-trials.json)`,
    `- [Active trials](${BASE_URL}/data/atlas/active-trials.json)`,
    `- [Recommendations](${BASE_URL}/data/atlas/recommendations.json)`,
    `- [Citations](${BASE_URL}/data/atlas/citations.json)`,
    `- [Guidelines index](${BASE_URL}/data/guidelines/index.json)`,
    `- [Management cards](${BASE_URL}/data/management-cards.json)`,
    `- [Generic BP protocols](${BASE_URL}/data/generic-protocols.json)`,
    `- [What's new feed](${BASE_URL}/whats-new.json)`,
    `- [Calculators index](${BASE_URL}/data/calculators-index.json)`,
    '',
    '## Addressable views (hash routes)',
    ...ROUTES.map((r) => `- \`${r.route}\` — ${r.label}`),
    '',
    '## For AI agents',
    '- A stroke-CDS MCP server (in the repo under `/mcp`) exposes calculators and atlas data as callable educational tools.',
    '- Each JSON endpoint carries `_meta` (schemaVersion, appVersion, checksum, source, disclaimer). Agents must propagate the disclaimer with any output.',
    '- Agents must not process PHI or real encounter details from this public demo.',
    '- No hospital-specific protocols are published here; do not use this public demo for real encounters or PHI.',
    '',
    '## Policy',
    '- Not medical advice. Do not enter PHI or real encounter details. Verify against primary sources (PMIDs/DOIs included in the atlas) and approved local protocol.',
    `- License: ${LICENSE}`,
    '',
  ].join('\n');
  write('llms.txt', llms);

  // ---- llms-full.txt (adds endpoint detail) ----
  const llmsFull = [
    llms.trimEnd(),
    '',
    '## Endpoint detail',
    `All endpoints share the envelope: \`{ "_meta": {...}, "data": ... }\`. \`_meta.checksum\` is a`,
    'sha256 prefix of the payload — poll it to detect data changes (it is stable across rebuilds',
    'unless the underlying clinical data changed).',
    '',
    '### Calculators',
    ...CALCULATORS.map((c) => `- \`${c.id}\` — ${c.name} (${c.category})`),
    '',
    '### Guidelines',
    ...gindex.map((g) => `- ${g.shortTitle || g.title} — ${g.recommendationCount} recommendations${g.doi ? ` (doi:${g.doi})` : ''}`),
    '',
  ].join('\n');
  write('llms-full.txt', llmsFull);

  // ---- robots.txt ----
  write('robots.txt', [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${BASE_URL}/sitemap.xml`,
    '# AI manifest: /llms.txt',
    '',
  ].join('\n'));

  // ---- sitemap.xml (real crawlable URLs only; SPA hash routes are in llms.txt) ----
  const urls = [`${BASE_URL}/`, `${BASE_URL}/llms.txt`, `${BASE_URL}/data/index.json`, ...endpoints.map((e) => `${BASE_URL}/${e}`)];
  write('sitemap.xml', [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((u) => `  <url><loc>${u}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n'));

  await Promise.all(writes);
  console.log(`agent-assets: ${checkOnly ? 'check OK' : `wrote ${endpoints.length + gfiles.length + 6} files`} (v${APP_VERSION}, schema ${SCHEMA_VERSION}).`);
}

main().catch((e) => {
  console.error('agent-assets generation failed:', e);
  process.exit(1);
});
