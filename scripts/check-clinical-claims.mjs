import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const normalizedLine = line => line.trim().replace(/\s+/g, ' ');

// Top-level declarations are left-aligned in education.jsx. Capture one
// component, not the whole library, so an unrelated lesson cannot stale every
// maintained PDF. Dependencies are listed explicitly beside each export.
export function sourceSection(source, name) {
  const start = source.search(new RegExp(`^(?:export )?(?:function|const|class) ${name}\\b`, 'm'));
  if (start < 0) throw new Error(`Missing export source section: ${name}`);
  const remainder = source.slice(start);
  const next = remainder.slice(1).search(/\n(?:export )?(?:function|const|class) \w+/);
  return (next < 0 ? remainder : remainder.slice(0, next + 1)).trim();
}

// Deliberately finite inventory: selected high-risk rule groups on named
// surfaces, not a claim that every clinical statement has been converted.
export function collectClinicalOccurrences(inventory, read) {
  const occurrences = [];
  for (const file of inventory.scope.files) {
    const lines = read(file).toString().split('\n');
    let excludedProtocolSurface = false;
    const ordinals = {};
    lines.forEach((line, index) => {
      if (file === 'src/app.jsx' && line.includes('{/* Protocols Tab (')) excludedProtocolSurface = true;
      if (file === 'src/app.jsx' && line.includes('{/* End of Protocols Tab')) excludedProtocolSurface = false;
      if (excludedProtocolSurface) return;
      for (const group of inventory.groups) {
        if (!new RegExp(group.pattern, 'i').test(line)) continue;
        const excerpt = normalizedLine(line);
        const ordinal = ordinals[group.id] = (ordinals[group.id] || 0) + 1;
        occurrences.push({ id: `${group.id}:${file}:${ordinal}`, groupId: group.id, file, line: index + 1, excerpt, sha256: sha256(excerpt) });
      }
    });
  }
  return occurrences;
}

export function checkClinicalClaims({ inventory, claims, read }) {
  const findings = [];
  const add = (group, code, message, affected = []) => findings.push({ severity: group?.severity || 'critical', groupId: group?.id || null, code, message, affected });
  const knownClaims = new Map(claims.map(claim => [claim.id, claim]));
  const current = collectClinicalOccurrences(inventory, read);
  const currentById = new Map(current.map(item => [item.id, item]));
  for (const claim of claims) {
    if (!inventory.groups.some(group => Object.hasOwn(group.claimHashes || {}, claim.id))) add(null, 'untracked-canonical-claim', `Canonical ${claim.id} has no inventoried rule group; add its consumers and source/export dependencies.`);
  }
  for (const group of inventory.groups) {
    const affected = [
      ...inventory.occurrences.filter(item => item.groupId === group.id).map(item => `${item.file}:${currentById.get(item.id)?.line || item.line} (${item.disposition})`),
      ...(inventory.artifactOccurrences || []).filter(item => item.groupId === group.id).map(item => `${item.file}, page ${item.page} (${item.disposition})`)
    ];
    for (const [id, expected] of Object.entries(group.claimHashes || {})) {
      const claim = knownClaims.get(id);
      if (!claim || sha256(JSON.stringify(claim)) !== expected) add(group, 'changed-canonical-claim', `Canonical ${id} changed: review every mapped occurrence and export before accepting the new wording.`, affected);
    }
    for (const [file, expected] of Object.entries(group.sourceHashes || {})) {
      if (sha256(read(file)) !== expected) add(group, 'changed-source', `Source record ${file} changed: reassess the adopted statement and each mapped use.`, affected);
    }
  }
  const prior = new Map(inventory.occurrences.map(item => [item.id, item]));
  for (const occurrence of current) {
    const group = inventory.groups.find(item => item.id === occurrence.groupId);
    const old = prior.get(occurrence.id);
    if (!old || old.sha256 !== occurrence.sha256) add(group, 'unreviewed-occurrence', `New or changed statement at ${occurrence.file}:${occurrence.line}; assign a canonical/excluded/requires-manual-verification disposition.`, [occurrence.id]);
    prior.delete(occurrence.id);
  }
  for (const occurrence of prior.values()) add(inventory.groups.find(item => item.id === occurrence.groupId), 'removed-occurrence', `Occurrence removed at ${occurrence.file}:${occurrence.line}; update the trace after checking replacement/removal.`, [occurrence.id]);
  for (const occurrence of inventory.occurrences) {
    if (!['canonical', 'excluded', 'requires-manual-verification'].includes(occurrence.disposition) || !occurrence.reason) add(null, 'missing-disposition', `Missing review disposition/reason: ${occurrence.id}`);
    if (occurrence.disposition === 'canonical' && !(occurrence.claimIds?.length || occurrence.canonicalSources?.length)) add(null, 'missing-canonical-link', `No canonical claim/source linked: ${occurrence.id}`);
    for (const id of occurrence.claimIds || []) {
      if (!knownClaims.has(id)) add(null, 'unknown-canonical-link', `Occurrence ${occurrence.id} names an unknown canonical claim: ${id}`);
    }
  }
  for (const exported of inventory.exports || []) {
    const affected = [exported.file];
    for (const [file, expected] of Object.entries(exported.inputHashes)) {
      if (sha256(read(file)) !== expected) add(null, 'stale-export-input', `${exported.file} may be stale: ${file} changed. Regenerate and verify the export, then record its new input/output hashes.`, affected);
    }
    for (const section of exported.inputSections || []) {
      if (sha256(sourceSection(read(section.file).toString(), section.name)) !== section.sha256) add(null, 'stale-export-section', `${exported.file} may be stale: ${section.name} changed. Regenerate and verify this export before updating its fingerprints.`, affected);
    }
    if (sha256(read(exported.file)) !== exported.sha256) add(null, 'unreviewed-export', `${exported.file} changed without an updated reviewed export fingerprint.`, affected);
  }
  for (const artifact of inventory.artifactInventory || []) {
    if (artifact.disposition === 'historical-archive' && sha256(read(artifact.file)) !== artifact.sha256) add(null, 'changed-historical-artifact', `Historical artifact changed: ${artifact.file}. Recheck the recorded PDF occurrences and preserve its explicit archive disposition.`, [artifact.file]);
  }
  return { ok: findings.length === 0, groups: inventory.groups.length, occurrences: current.length, artifactOccurrences: (inventory.artifactOccurrences || []).length, exports: (inventory.exports || []).length, findings };
}

export function runClinicalClaimCheck(projectRoot = root) {
  const read = file => fs.readFileSync(path.resolve(projectRoot, file));
  return checkClinicalClaims({ inventory: JSON.parse(read('docs/clinical-claim-occurrences.json')), claims: JSON.parse(read('src/clinical/claims.json')), read });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = runClinicalClaimCheck();
    if (process.argv.includes('--json')) console.log(JSON.stringify(result, null, 2));
    else {
      console.log(`Clinical claim trace: ${result.ok ? 'PASS' : 'FAIL'} (${result.groups} bounded groups, ${result.occurrences} occurrences, ${result.exports} exports).`);
      result.findings.forEach(item => console.error(`[${item.severity}] ${item.code}: ${item.message}\n  ${item.affected.join('\n  ')}`));
    }
    process.exitCode = result.ok ? 0 : 1;
  } catch (error) {
    console.error(`Clinical claim trace failed: ${error.message}`);
    process.exitCode = 1;
  }
}
