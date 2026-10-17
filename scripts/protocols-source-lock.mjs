// Protocols-tab source lock: exact hashes of the sources and shared outputs that
// determine Protocols content. Complements the rendered locks
// (snapshot-example-protocols.mjs and protocols-tab-lock.mjs).
//
//   files     SHA-256 of Protocols-owned source files (line endings normalized).
//   exports   SHA-256 of the serialized data the Protocols tab reads from shared modules.
//   behavior  SHA-256 of shared-function outputs over fixed synthetic inputs
//             (dose arithmetic, reversal lines, elapsed time, Encounter-to-Protocols projection).
//
// Usage: node scripts/protocols-source-lock.mjs [--update]
// tests/protocols-source-lock.test.js runs the check in the unit suite. --update is
// legitimate only for an owner-approved Protocols change; record why in the commit.

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const LOCK_FILE = path.join(ROOT, 'tests', 'snapshots', 'protocols-tab', 'source-lock.json');

// Files whose content is shown only (or primarily) in the Protocols tab.
export const LOCKED_FILES = [
  'src/ProtectedProtocols.jsx',
  'src/components/QuickReference.jsx',
  'src/pocket-cards.jsx',
  'src/institutional-protocols.js',
  'src/management-guidance.js',
  'src/clinical/reversal-dose.js',
  'src/evidence-encounter.js',
  'tests/snapshots/example-protocols/ich.txt',
  'tests/snapshots/example-protocols/ischemic.txt'
];

const sha = value => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
// Stable serialization: keys in insertion order; functions as a marker (their source
// text and names differ between Node and the test transform; the owning files are hashed).
const serialize = value => JSON.stringify(value, (key, item) => typeof item === 'function' ? 'fn' : item === undefined ? '__undefined__' : Number.isNaN(item) ? '__NaN__' : item);
const load = rel => import(pathToFileURL(path.join(ROOT, rel)).href);

function encounterFixture(newEncounter, patch) {
  const base = newEncounter();
  return { ...base, ...patch, note: { ...base.note, ...(patch.note || {}) } };
}

export async function computeLock() {
  // Local-time parsing is part of the projection; pin the zone the rendered lock uses.
  const previousTz = process.env.TZ;
  process.env.TZ = 'America/Los_Angeles';
  try { return await compute(); } finally { if (previousTz === undefined) delete process.env.TZ; else process.env.TZ = previousTz; }
}

async function compute() {
  const files = {};
  for (const rel of LOCKED_FILES) files[rel] = sha(readFileSync(path.join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n'));

  const evidence = await load('src/evidence/index.js');
  const guidance = await load('src/management-guidance.js');
  const navigation = await load('src/protocol-navigation.js');
  const exportsLock = {
    'evidence.recommendations': sha(serialize(evidence.recommendations)),
    'evidence.claims': sha(serialize(evidence.claims)),
    'evidence.citations': sha(serialize(evidence.citations)),
    'evidence.citationLinks': sha(serialize(evidence.citations.map(c => evidence.citationLink(c)))),
    // Module namespaces enumerate in different orders under Node and the test runner.
    'management-guidance.all': sha(serialize(Object.fromEntries(Object.keys(guidance).filter(key => key !== 'default' && key !== '__esModule').sort().map(key => [key, guidance[key]])))),
    'protocol-navigation.PROTOCOL_TARGETS': sha(serialize(navigation.PROTOCOL_TARGETS))
  };

  const calc = await load('src/calculators.js');
  const reversal = await load('src/clinical/reversal-dose.js');
  const time = await load('src/clinical/encounter-time.js');
  const ws = await load('src/workspace-state.js');
  const weights = [undefined, null, '', 'abc', -1, 0, 0.5, 1, 2.9, 3, 29.9, 30, 35, 40, 49.9, 50, 59.9, 60, 69.9, 70, 79.9, 80, 89.9, 90, 99.9, 100, 100.1, 120, 150, 200, 349, 350, 351, 500, '82', ' 82 ', '82.5'];
  const agents = ['', 'none', 'apixaban', 'rivaroxaban', 'edoxaban', 'dabigatran', 'warfarin', 'heparin', 'lmwh', 'other', 'unknown'];
  const fixedNow = Date.parse('2026-10-17T21:00:00.000Z');
  const references = [null, { time: new Date(fixedNow - 90 * 60000), label: 'LKW' }, { time: new Date(fixedNow - 25 * 3600000), label: 'LKW' }, { time: new Date(fixedNow + 60000), label: 'LKW' }, { time: new Date(fixedNow - 270 * 60000), label: 'Discovery' }];
  const states = [
    {},
    { note: { diagnosisCategory: 'ischemic', age: '68', weight: '82', premorbidMRS: '0', lkwDate: '2026-10-17', lkwTime: '12:30', presentingBP: '172/94', glucose: '142', ctHemorrhageStatus: 'absent', disablingDeficit: true, vesselOcclusion: ['M1'], lastDOACType: 'none' }, nihssSource: 'reported', reportedNihss: '12', aspects: '9', drug: 'TNK' },
    { note: { diagnosisCategory: 'ischemic', age: '71', weight: '66', lkwDate: '2026-10-17', lkwTime: '12:10', presentingBP: '168/88', lastDOACType: 'apixaban', lastDOACDose: '2026-10-17T06:00' }, nihssSource: 'reported', reportedNihss: '9' },
    { note: { diagnosisCategory: 'ischemic', age: '57', weight: '82.1', lkwDate: '2026-10-17', lkwTime: '13:05' } },
    { note: { diagnosisCategory: 'ischemic', age: '64', weight: '90', lkwDate: '2026-10-17', lkwTime: '01:30', presentingBP: '190/105', glucose: '45', vesselOcclusion: ['ICA', 'M1'], coreVolume: '22', penumbraVolume: '90', lastDOACType: 'none' }, aspects: '7' },
    { note: { diagnosisCategory: 'ischemic', age: '59', lkwUnknown: true, discoveryDate: '2026-10-17', discoveryTime: '12:45', vesselOcclusion: ['M2'], m2Segment: 'dominant-proximal', wakeUpStrokeWorkflow: { mriAvailable: true, dwi: { positiveForLesion: true }, flair: { noMarkedHyperintensity: true }, dwiLesionUnderOneThirdMCA: true }, lastDOACType: 'none' } },
    { note: { diagnosisCategory: 'ischemic', age: '74', lkwDate: '2026-10-16', lkwTime: '23:30', vesselOcclusion: ['Basilar'], lastDOACType: 'warfarin', inr: '1.4' }, pcAspects: '8' },
    { note: { diagnosisCategory: 'ich', age: '72', weight: '70', lastDOACType: 'apixaban', lastDOACDose: '2026-10-17T08:00' }, volume: { a: '4.2', b: '3.1', thicknessMm: '5', numSlices: '6' } },
    { context: 'follow-up', note: { diagnosisCategory: 'ischemic', weight: '80', lastDOACType: 'apixaban' } }
  ];
  const behavior = {
    'calculators.tnkGuideline': sha(serialize(weights.map(w => calc.calculateTNKDoseReviewed(w, 'guideline')))),
    'calculators.tnkLabel': sha(serialize(weights.map(w => calc.calculateTNKDoseReviewed(w, 'fda-label')))),
    'calculators.alteplase': sha(serialize(weights.map(w => calc.calculateAlteplaseDoseReviewed(w)))),
    'reversal-dose.lines': sha(serialize(agents.flatMap(agent => [undefined, 70, 120].flatMap(weightKg => [undefined, '1.2', '2.8', '6'].flatMap(inr => [null, 6, 20].map(lastDoseHours => reversal.reversalDoseLine({ weightKg, agent, inr, lastDoseHours }))))))),
    'encounter-time.elapsed': sha(serialize(references.map(ref => time.elapsedEncounterTime(ref, new Date(fixedNow))))),
    'workspace-state.protocolProjection': sha(serialize(states.map(patch => {
      const state = encounterFixture(ws.newEncounter, patch);
      const projection = ws.protocolEncounter(state, fixedNow);
      return { projection, nihss: ws.encounterNihss(state), timing: ws.encounterTiming(state.note, fixedNow), volume: ws.protocolVolumeEstimate(ws.encounterVolume(state.volume)) };
    })))
  };
  return { files, exports: exportsLock, behavior };
}

export function diffLock(expected, actual) {
  const problems = [];
  for (const section of ['files', 'exports', 'behavior']) {
    const want = expected?.[section] || {}, got = actual[section];
    for (const key of new Set([...Object.keys(want), ...Object.keys(got)])) {
      if (want[key] !== got[key]) problems.push(`${section} ${key}: ${want[key] ? 'changed' : 'not in lock'}`);
    }
  }
  return problems;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const actual = await computeLock();
  if (process.argv.includes('--update')) {
    writeFileSync(LOCK_FILE, `${JSON.stringify({ note: 'Protocols-tab source lock. Update only for an owner-approved Protocols change; see scripts/protocols-source-lock.mjs.', ...actual }, null, 2)}\n`);
    console.log(`wrote ${path.relative(ROOT, LOCK_FILE)}`);
  } else {
    const problems = diffLock(JSON.parse(readFileSync(LOCK_FILE, 'utf8')), actual);
    if (problems.length) { console.error('PROTOCOLS SOURCE LOCK FAILED'); for (const problem of problems) console.error(`- ${problem}`); process.exit(1); }
    console.log('Protocols source lock: PASS');
  }
}
