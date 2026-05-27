// scripts/parameter-sweep.mjs
//
// Analyst harness — sweeps a parameter grid through the calculator and matcher
// engines and emits CSV of which trial branches / eligibility tiers / risk
// categories fire. Useful for retrospective audits, registry comparisons, and
// grant-application figures.
//
// USAGE:
//   node scripts/parameter-sweep.mjs --output output/sweep-tnk.csv --domain tnk
//   node scripts/parameter-sweep.mjs --domain large-core-evt
//   node scripts/parameter-sweep.mjs --domain dapt
//   node scripts/parameter-sweep.mjs --domain dawn
//   node scripts/parameter-sweep.mjs --domain phases
//   node scripts/parameter-sweep.mjs --domain late-window-lytic
//
// DESIGN:
// — Each domain defines (a) its parameter grid (axes × values) and
//   (b) the function under sweep. Cross-product is materialized lazily.
// — Output is one row per (input, output) pair, with one column per axis
//   plus columns for the structured calculator output.
// — Pure-data (no live network, no DB). Re-runnable.
//
// EXTENSION:
//   Add a new domain to DOMAINS below. See `tnk` for the simplest pattern.

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const repoRoot = process.cwd();
const args = process.argv.slice(2);
function arg(name, def) {
  const i = args.findIndex((a) => a === `--${name}`);
  return i >= 0 ? args[i + 1] : def;
}

const domain = arg('domain', 'all');
const outputPath = arg('output', null);

function csvEscape(v) {
  if (v == null) return '';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function csvRow(cols) { return cols.map(csvEscape).join(','); }

function* product(axes) {
  const keys = Object.keys(axes);
  if (keys.length === 0) { yield {}; return; }
  function* go(idx, partial) {
    if (idx === keys.length) { yield { ...partial }; return; }
    const k = keys[idx];
    for (const v of axes[k]) {
      partial[k] = v;
      yield* go(idx + 1, partial);
    }
  }
  yield* go(0, {});
}

async function loadCalculators() {
  const m1 = await import(pathToFileURL(path.join(repoRoot, 'src/calculators.js')).href);
  const m2 = await import(pathToFileURL(path.join(repoRoot, 'src/calculators-extended.js')).href);
  return { ...m1, ...m2 };
}

const DOMAINS = {
  // ---- TNK / alteplase dose grid ----
  tnk: {
    description: 'TNK dose by weight, 30-150 kg in 5-kg steps',
    axes: { weightKg: range(30, 150, 5) },
    columns: ['weightKg', 'calculatedDose', 'volume', 'isMaxDose'],
    run: (calc, p) => {
      const r = calc.calculateTNKDose(p.weightKg);
      return r ? { ...p, ...r } : null;
    }
  },

  alteplase: {
    description: 'Alteplase dose by weight, 30-130 kg in 5-kg steps',
    axes: { weightKg: range(30, 130, 5) },
    columns: ['weightKg', 'totalDose', 'bolus', 'infusion', 'capped'],
    run: (calc, p) => {
      const r = calc.calculateAlteplaseDose(p.weightKg);
      return r ? { ...p, ...r } : null;
    }
  },

  crcl: {
    description: 'Cockcroft-Gault CrCl across age × weight × Cr × sex',
    axes: {
      age: [40, 50, 60, 70, 80, 90],
      weight: [50, 70, 90, 110],
      sex: ['M', 'F'],
      creatinine: [0.7, 1.0, 1.5, 2.0, 3.0]
    },
    columns: ['age', 'weight', 'sex', 'creatinine', 'value', 'renalCategory', 'isLow'],
    run: (calc, p) => {
      const r = calc.calculateCrCl(p.age, p.weight, p.sex, p.creatinine);
      return r ? { ...p, ...r } : null;
    }
  },

  // ---- DAWN tier matrix ----
  dawn: {
    description: 'DAWN tier matrix across age × NIHSS × core × time',
    axes: {
      age: [55, 65, 75, 80, 85],
      nihss: [8, 10, 14, 18, 22],
      coreMl: [10, 20, 30, 40, 50, 60],
      timeFromLKWh: [6, 12, 18, 24]
    },
    columns: ['age', 'nihss', 'coreMl', 'timeFromLKWh', 'eligible', 'tier', 'reason'],
    run: (calc, p) => {
      const r = calc.evaluateDAWN(p);
      return r ? { ...p, ...r } : null;
    }
  },

  // ---- DEFUSE-3 sweep ----
  'defuse-3': {
    description: 'DEFUSE-3 mismatch matrix across core × penumbra × time',
    axes: {
      coreMl: [20, 40, 60, 80],
      penumbraMl: [40, 80, 120, 160],
      timeFromLKWh: [6, 10, 14, 18],
      nihss: [8, 16, 24],
      age: [60]
    },
    columns: ['coreMl', 'penumbraMl', 'timeFromLKWh', 'nihss', 'eligible', 'mismatchVolumeMl', 'mismatchRatio', 'reason'],
    run: (calc, p) => {
      const r = calc.evaluateDEFUSE3(p);
      return r ? { ...p, ...r } : null;
    }
  },

  // ---- Large-core EVT trial-branch sweep ----
  'large-core-evt': {
    description: 'Which large-core EVT trial(s) match across ASPECTS × time × NIHSS × age × premorbid mRS',
    axes: {
      aspects: [0, 1, 2, 3, 4, 5, 6],
      timeFromLKWh: [4, 6, 9, 12, 18, 24],
      nihss: [6, 10, 16, 22],
      age: [55, 70, 80, 85],
      premorbidMRS: [0, 1, 2]
    },
    columns: ['aspects', 'timeFromLKWh', 'nihss', 'age', 'premorbidMRS', 'eligible', 'bestMatch', 'matchingTrials', 'beyondTrialRange'],
    run: (calc, p) => {
      const r = calc.evaluateLargeCoreEVT({ ...p, coreMl: null });
      return r ? { ...p, ...r, matchingTrials: (r.matchingTrials || []).join(',') } : null;
    }
  },

  // ---- DAPT branch matrix ----
  dapt: {
    description: 'CHANCE/POINT/INSPIRES/THALES branching across NIHSS × ABCD2 × time × atherosclerosis',
    axes: {
      strokeType: ['ischemic', 'tia'],
      nihss: [1, 3, 5, 7, 9],
      abcd2: [3, 4, 5, 6, 7],
      atherosclerotic: [false, true],
      lvdSymptomatic: [false, true],
      timeFromOnsetH: [12, 24, 48, 72]
    },
    columns: ['strokeType', 'nihss', 'abcd2', 'atherosclerotic', 'lvdSymptomatic', 'timeFromOnsetH', 'regimen', 'duration', 'class'],
    run: (calc, p) => {
      const r = calc.recommendAcuteDAPT(p);
      return r ? { ...p, ...r } : null;
    }
  },

  // ---- Late-window lytic (TRACE-III) sweep ----
  'late-window-lytic': {
    description: 'TRACE-III eligibility across LKW × LVO × EVT-availability × NIHSS × core × mismatch',
    axes: {
      timeFromLKWh: [3, 6, 12, 18, 24, 26],
      lvo: [false, true],
      evtAvailable: [false, true],
      nihss: [4, 8, 16, 25, 30],
      age: [60],
      coreMl: [30, 60, 80],
      mismatchRatio: [1.5, 2.0, 3.0],
      mismatchVolumeMl: [10, 30, 50]
    },
    columns: ['timeFromLKWh', 'lvo', 'evtAvailable', 'nihss', 'coreMl', 'mismatchRatio', 'mismatchVolumeMl', 'eligible', 'reason'],
    run: (calc, p) => {
      const r = calc.recommendLateWindowLytic(p);
      return r ? { ...p, ...r } : null;
    }
  },

  // ---- PHASES rupture-risk per-score ----
  phases: {
    description: 'PHASES 5-yr rupture risk across all scores 0-15',
    axes: { score: range(0, 15, 1) },
    columns: ['score', 'risk', 'level', 'fivYearPct'],
    run: (calc, p) => ({ ...p, ...calc.getPHASESRisk(p.score) })
  },

  // ---- ROPE × age sweep ----
  rope: {
    description: 'ROPE score × age × risk-factor combinations',
    axes: {
      age: [25, 35, 45, 55, 65, 75],
      noHypertension: [false, true],
      noDiabetes: [false, true],
      noStrokeTia: [false, true],
      nonsmoker: [false, true],
      cortical: [false, true]
    },
    columns: ['age', 'noHypertension', 'noDiabetes', 'noStrokeTia', 'nonsmoker', 'cortical', 'score'],
    run: (calc, p) => ({ ...p, score: calc.calculateROPEScore(p) })
  }
};

function range(lo, hi, step) {
  const out = [];
  for (let v = lo; v <= hi; v += step) out.push(+v.toFixed(2));
  return out;
}

async function runDomain(name, calc, outputDir) {
  const def = DOMAINS[name];
  if (!def) throw new Error(`Unknown domain '${name}'. Available: ${Object.keys(DOMAINS).join(', ')}`);

  const lines = [csvRow(def.columns)];
  let count = 0;
  for (const params of product(def.axes)) {
    const result = def.run(calc, params);
    if (!result) continue;
    lines.push(csvRow(def.columns.map((c) => result[c])));
    count++;
  }

  const outFile = outputPath || path.join(outputDir, `sweep-${name}.csv`);
  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, lines.join('\n'), 'utf8');
  console.log(`[${name}] ${count} rows → ${path.relative(repoRoot, outFile)}`);
  return { name, count, outFile };
}

async function main() {
  const calc = await loadCalculators();
  const outputDir = path.join(repoRoot, 'output', 'parameter-sweeps');

  const targets = domain === 'all' ? Object.keys(DOMAINS) : [domain];
  const results = [];
  for (const t of targets) {
    results.push(await runDomain(t, calc, outputDir));
  }

  console.log('');
  console.log(`Parameter sweep complete: ${targets.length} domain(s), ${results.reduce((s, r) => s + r.count, 0)} total rows.`);
  console.log(`Output directory: ${path.relative(repoRoot, outputDir)}`);
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
