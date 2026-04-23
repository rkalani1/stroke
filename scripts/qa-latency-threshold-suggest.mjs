import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const args = process.argv.slice(2);

function getArg(flag, fallback) {
  const idx = args.indexOf(flag);
  if (idx === -1) return fallback;
  const value = String(args[idx + 1] || '').trim();
  if (!value) throw new Error(`Missing value for ${flag}`);
  return value;
}

function getPositiveInt(flag, fallback) {
  const raw = getArg(flag, String(fallback));
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) throw new Error(`Invalid value for ${flag}: ${raw}`);
  return n;
}

function percentile(sorted, p) {
  if (!sorted.length) return null;
  if (sorted.length === 1) return sorted[0];
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const weight = idx - lo;
  return Math.round(sorted[lo] * (1 - weight) + sorted[hi] * weight);
}

function recommendedThresholdMs(p95) {
  const padded = Math.ceil((p95 * 1.2) / 1000) * 1000;
  return Math.max(padded, 10000);
}

function fmt(value) {
  if (value == null) return 'n/a';
  return `${Math.round(value)} ms`;
}

async function readJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function main() {
  const historyArg = getArg('--history', 'docs/qa-latency-history.json');
  const profilesArg = getArg('--profiles', 'docs/qa-latency-profiles.json');
  const outputArg = getArg('--output', 'docs/qa-latency-threshold-suggestions.md');
  const lookback = getPositiveInt('--lookback', 30);

  const historyPath = path.isAbsolute(historyArg) ? historyArg : path.join(process.cwd(), historyArg);
  const profilesPath = path.isAbsolute(profilesArg) ? profilesArg : path.join(process.cwd(), profilesArg);
  const outputPath = path.isAbsolute(outputArg) ? outputArg : path.join(process.cwd(), outputArg);

  const history = await readJson(historyPath, []);
  const profilesRaw = await readJson(profilesPath, {});

  const profiles = profilesRaw?.profiles && typeof profilesRaw.profiles === 'object' ? profilesRaw.profiles : profilesRaw;
  const adaptiveProfile = profiles?.adaptive && typeof profiles.adaptive === 'object' ? profiles.adaptive : {};
  const currentThresholds =
    adaptiveProfile.runThresholdByTargetViewport && typeof adaptiveProfile.runThresholdByTargetViewport === 'object'
      ? adaptiveProfile.runThresholdByTargetViewport
      : {};

  const recent = Array.isArray(history) ? history.slice(-lookback) : [];
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

  const keys = new Set([...Object.keys(currentThresholds), ...grouped.keys()]);
  const sortedKeys = [...keys].sort();

  const lines = [];
  const generatedAt = new Date().toISOString();
  lines.push('# QA Latency Threshold Suggestions (Auto-generated)');
  lines.push('');
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`History source: ${path.relative(process.cwd(), historyPath)}`);
  lines.push(`Profiles source: ${path.relative(process.cwd(), profilesPath)}`);
  lines.push(`Lookback entries: ${recent.length}`);
  lines.push('');

  if (!sortedKeys.length) {
    lines.push('No data available to generate threshold suggestions.');
  } else {
    lines.push('| Target/Viewport | Samples | Current threshold | P95 observed | Recommended threshold | Delta | Action |');
    lines.push('|---|---:|---:|---:|---:|---:|---|');

    for (const key of sortedKeys) {
      const samples = (grouped.get(key) || []).slice().sort((a, b) => a - b);
      const p95 = samples.length ? percentile(samples, 0.95) : null;
      const recommended = p95 == null ? null : recommendedThresholdMs(p95);
      const current = Number.isFinite(Number(currentThresholds[key])) ? Number(currentThresholds[key]) : null;
      const delta = current == null || recommended == null ? null : recommended - current;

      let action = 'keep';
      if (current == null && recommended != null) {
        action = 'add';
      } else if (current != null && recommended == null) {
        action = 'insufficient data';
      } else if (current != null && recommended != null && Math.abs(delta) >= 1000) {
        action = 'update';
      }

      lines.push(
        `| ${key} | ${samples.length} | ${fmt(current)} | ${fmt(p95)} | ${fmt(recommended)} | ${fmt(delta)} | ${action} |`
      );
    }

    lines.push('');
    lines.push('Recommendation method: `recommended threshold = max(10000, rounded(P95 x 1.2))`.');
    lines.push('Use `update`/`add` rows to manually revise `docs/qa-latency-profiles.json` when clinically acceptable.');
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${lines.join('\n')}\n`, 'utf8');
  console.log(`Generated ${path.relative(process.cwd(), outputPath)}.`);
}

main().catch((error) => {
  console.error(error?.stack || String(error));
  process.exit(1);
});
