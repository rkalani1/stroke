import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const args = process.argv.slice(2);

function getArg(flag, fallback) {
  const index = args.indexOf(flag);
  if (index === -1) return fallback;
  const value = String(args[index + 1] || '').trim();
  if (!value) {
    throw new Error(`Missing value for ${flag}.`);
  }
  return value;
}

function getPositiveIntArg(flag, fallback) {
  const raw = getArg(flag, String(fallback));
  const numeric = Number.parseInt(raw, 10);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error(`Invalid value for ${flag}: ${raw}`);
  }
  return numeric;
}

function percentile(sortedValues, p) {
  if (!sortedValues.length) return null;
  if (sortedValues.length === 1) return sortedValues[0];
  const idx = (sortedValues.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedValues[lo];
  const weight = idx - lo;
  return Math.round(sortedValues[lo] * (1 - weight) + sortedValues[hi] * weight);
}

function ms(value) {
  return `${Math.round(value)} ms`;
}

function recommendedThresholdMs(p95) {
  const padded = Math.ceil((p95 * 1.2) / 1000) * 1000;
  return Math.max(padded, 10000);
}

async function main() {
  const historyArg = getArg('--history', 'docs/qa-latency-history.json');
  const outputArg = getArg('--output', 'docs/qa-latency-recalibration.md');
  const lookback = getPositiveIntArg('--lookback', 30);

  const historyPath = path.isAbsolute(historyArg) ? historyArg : path.join(process.cwd(), historyArg);
  const outputPath = path.isAbsolute(outputArg) ? outputArg : path.join(process.cwd(), outputArg);

  let history = [];
  try {
    const raw = await fs.readFile(historyPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) history = parsed;
  } catch {
    history = [];
  }

  const recent = history.slice(-lookback);
  const grouped = new Map();

  for (const entry of recent) {
    if (!Array.isArray(entry?.runDurations)) continue;
    for (const run of entry.runDurations) {
      if (!run?.target || !run?.viewport || !Number.isFinite(run?.durationMs)) continue;
      const key = `${run.target}/${run.viewport}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(run.durationMs);
    }
  }

  const keys = [...grouped.keys()].sort();
  const totalSamples = [...grouped.values()].reduce((sum, arr) => sum + arr.length, 0);
  const generatedAt = new Date().toISOString();

  const lines = [];
  lines.push('# QA Latency Recalibration (Auto-generated)');
  lines.push('');
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`History source: ${path.relative(process.cwd(), historyPath)}`);
  lines.push(`Lookback entries: ${recent.length}`);
  lines.push(`Total samples: ${totalSamples}`);
  lines.push('');

  if (!keys.length) {
    lines.push('No run-duration samples were available in the selected lookback window.');
    lines.push('');
    lines.push('Run `npm run qa` to generate latency history snapshots, then rerun recalibration.');
  } else {
    lines.push('| Target/Viewport | Samples | P50 | P95 | Max | Recommended threshold |');
    lines.push('|---|---:|---:|---:|---:|---:|');

    for (const key of keys) {
      const values = grouped.get(key).slice().sort((a, b) => a - b);
      const p50 = percentile(values, 0.5);
      const p95 = percentile(values, 0.95);
      const max = values[values.length - 1];
      const recommended = recommendedThresholdMs(p95);
      lines.push(`| ${key} | ${values.length} | ${ms(p50)} | ${ms(p95)} | ${ms(max)} | ${ms(recommended)} |`);
    }

    lines.push('');
    lines.push('Method: recommended threshold = rounded `P95 x 1.2` (minimum `10000 ms`).');
    lines.push('Use this table to adjust `docs/qa-latency-profiles.json` when sustained baseline drift is observed.');
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${lines.join('\n')}\n`, 'utf8');
  console.log(`Generated ${path.relative(process.cwd(), outputPath)}.`);
}

main().catch((error) => {
  console.error(error?.stack || String(error));
  process.exit(1);
});
