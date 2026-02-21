import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const PROFILE_PATH = path.join(process.cwd(), 'docs', 'evidence-churn-profiles.json');

function fail(message) {
  console.error(`Churn profile validation failed: ${message}`);
  process.exit(1);
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

async function main() {
  let raw = '';
  try {
    raw = await fs.readFile(PROFILE_PATH, 'utf8');
  } catch (error) {
    fail(`cannot read ${PROFILE_PATH}: ${error?.message || String(error)}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    fail(`invalid JSON in ${PROFILE_PATH}: ${error?.message || String(error)}`);
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    fail('top-level JSON must be an object.');
  }

  const profiles = parsed.profiles;
  if (!profiles || typeof profiles !== 'object' || Array.isArray(profiles)) {
    fail('top-level key "profiles" must be an object.');
  }

  const profileEntries = Object.entries(profiles);
  if (profileEntries.length === 0) {
    fail('"profiles" must contain at least one profile.');
  }

  if (!profiles.balanced) {
    fail('required profile "balanced" is missing.');
  }

  for (const [name, profile] of profileEntries) {
    if (!name || !name.trim()) {
      fail('profile names must be non-empty strings.');
    }
    if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
      fail(`profile "${name}" must be an object.`);
    }

    if ('description' in profile && typeof profile.description !== 'string') {
      fail(`profile "${name}" has non-string "description".`);
    }
    if (!isFiniteNumber(profile.churnAlertThreshold) || profile.churnAlertThreshold < 0) {
      fail(`profile "${name}" has invalid "churnAlertThreshold" (must be number >= 0).`);
    }
    if (!isFiniteNumber(profile.churnAdjustedAlertThreshold) || profile.churnAdjustedAlertThreshold < 0) {
      fail(`profile "${name}" has invalid "churnAdjustedAlertThreshold" (must be number >= 0).`);
    }
    if (!Number.isInteger(profile.churnLookback) || profile.churnLookback < 2) {
      fail(`profile "${name}" has invalid "churnLookback" (must be integer >= 2).`);
    }

    if (!profile.weights || typeof profile.weights !== 'object' || Array.isArray(profile.weights)) {
      fail(`profile "${name}" has invalid "weights" (must be object).`);
    }

    const weights = Object.entries(profile.weights);
    if (weights.length === 0) {
      fail(`profile "${name}" must define at least one topic weight.`);
    }
    for (const [topic, weight] of weights) {
      if (!topic || !topic.trim()) {
        fail(`profile "${name}" has an empty topic key in "weights".`);
      }
      if (!isFiniteNumber(weight) || weight <= 0) {
        fail(`profile "${name}" topic "${topic}" has invalid weight (must be number > 0).`);
      }
    }
  }

  console.log(`Churn profile validation passed: ${profileEntries.length} profiles in docs/evidence-churn-profiles.json.`);
}

main().catch((error) => {
  fail(error?.message || String(error));
});
