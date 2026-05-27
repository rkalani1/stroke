import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const args = process.argv.slice(2);
const fileArg = args[0] || 'docs/qa-latency-profiles.json';
const filePath = path.isAbsolute(fileArg) ? fileArg : path.join(process.cwd(), fileArg);

function fail(message) {
  console.error(message);
  process.exit(1);
}

function normalizeProfiles(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    fail('Latency profile file must contain an object.');
  }
  if (parsed.profiles != null) {
    if (typeof parsed.profiles !== 'object' || Array.isArray(parsed.profiles)) {
      fail('`profiles` must be an object map when present.');
    }
    return parsed.profiles;
  }
  return parsed;
}

function validateThresholdMap(mapValue, label) {
  if (mapValue == null) return;
  if (typeof mapValue !== 'object' || Array.isArray(mapValue)) {
    fail(`${label} must be an object map.`);
  }
  for (const [key, value] of Object.entries(mapValue)) {
    const trimmed = String(key || '').trim();
    if (!trimmed) {
      fail(`${label} contains an empty key.`);
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      fail(`${label}.${trimmed} must be a positive numeric millisecond value.`);
    }
  }
}

function validateProfile(profileName, profileValue) {
  if (!profileName.trim()) {
    fail('Profile names must be non-empty strings.');
  }
  if (!profileValue || typeof profileValue !== 'object' || Array.isArray(profileValue)) {
    fail(`profiles.${profileName} must be an object.`);
  }

  validateThresholdMap(profileValue.runThresholdByTargetViewport, `profiles.${profileName}.runThresholdByTargetViewport`);
  validateThresholdMap(profileValue.sectionThresholdBySection, `profiles.${profileName}.sectionThresholdBySection`);
  validateThresholdMap(
    profileValue.sectionThresholdByTargetViewportSection,
    `profiles.${profileName}.sectionThresholdByTargetViewportSection`
  );
}

async function main() {
  let raw;
  try {
    raw = await fs.readFile(filePath, 'utf8');
  } catch (error) {
    fail(`Unable to read latency profile file (${filePath}): ${error?.message || String(error)}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    fail(`Invalid JSON in latency profile file (${filePath}): ${error?.message || String(error)}`);
  }

  const profiles = normalizeProfiles(parsed);
  const entries = Object.entries(profiles);
  if (entries.length === 0) {
    fail('At least one latency profile must be defined.');
  }

  for (const [profileName, profileValue] of entries) {
    validateProfile(profileName, profileValue);
  }

  if (!Object.prototype.hasOwnProperty.call(profiles, 'flat')) {
    fail('Required latency profile missing: flat');
  }
  if (!Object.prototype.hasOwnProperty.call(profiles, 'adaptive')) {
    fail('Required latency profile missing: adaptive');
  }

  console.log(
    `QA latency profile validation passed: ${entries.length} profiles in ${path.relative(process.cwd(), filePath)}.`
  );
}

main().catch((error) => {
  fail(error?.message || String(error));
});
