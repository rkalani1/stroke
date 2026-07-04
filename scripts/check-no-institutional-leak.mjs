#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// LEAK GUARD -- institutional / PHI-adjacent content scanner.
//
// Defense-in-depth protecting the PUBLIC GitHub Pages build and source tree:
//   1. .gitignore  -> local-only extension files stay out of git.
//   2. _config.yml -> source, scripts, tests, docs, and local-only dirs stay
//                     out of the Pages artifact.
//   3. THIS SCRIPT -> fails the build if protected institutional, identity, or
//                     PHI-adjacent text lands in tracked source.
//
// The file list is fed on STDIN (newline-delimited) so this script never shells
// out — no child_process, no injection surface. The npm wrappers pipe git:
//   npm run check:leak-guard          (git ls-files            | node …)
//   npm run check:leak-guard:staged   (git diff --cached --name-only | node …)
// Add --json for machine-readable output.
//
// Three severity tiers (see leak-guard-denylist.json):
//   - institutionalTokens -- banned on the served/source surface; allowed only in
//     meta/policy files listed under exemptFiles.
//   - identityTokens -- maintainer identity / institutional domains;
//     banned in EVERY tracked file, no exemption.
//   - phiPatterns + phi literal hashes -- banned in EVERY tracked file, no exemption.
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const args = new Set(process.argv.slice(2));
const JSON_OUT = args.has('--json');
const REQUIRE_PRIVATE_DENYLIST =
  args.has('--require-private') ||
  process.env.STROKE_LEAK_GUARD_REQUIRE_PRIVATE === '1';

function loadJsonFile(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function mergeRuleLists(base, extra) {
  const merged = { ...base };
  for (const key of [
    'institutionalTokens',
    'identityTokens',
    'phiPatterns',
    'literalDenylist',
    'literalSha256Denylist',
    'allowedInstitutionalDisclaimerPatterns',
    'fullyExemptFiles',
    'exemptFiles',
    'institutionalScanExcludeDirs',
    'binaryExtensions'
  ]) {
    merged[key] = [
      ...(Array.isArray(base[key]) ? base[key] : []),
      ...(Array.isArray(extra[key]) ? extra[key] : [])
    ];
  }
  return merged;
}

function countScanRules(ruleset) {
  return [
    'institutionalTokens',
    'identityTokens',
    'phiPatterns',
    'literalDenylist',
    'literalSha256Denylist'
  ].reduce((count, key) => count + (Array.isArray(ruleset[key]) ? ruleset[key].length : 0), 0);
}

const publicDenylist = loadJsonFile(new URL('./leak-guard-denylist.json', import.meta.url));
const privateDenylistCandidates = [
  process.env.STROKE_LEAK_GUARD_PRIVATE_DENYLIST,
  path.join(ROOT, 'scripts/leak-guard-denylist.local.json')
].filter(Boolean);

let denylist = publicDenylist;
let privateDenylistLoaded = false;
let privateDenylistRuleCount = 0;
for (const candidate of privateDenylistCandidates) {
  if (!fs.existsSync(candidate)) continue;
  const privateDenylist = loadJsonFile(candidate);
  privateDenylistRuleCount += countScanRules(privateDenylist);
  denylist = mergeRuleLists(denylist, privateDenylist);
  privateDenylistLoaded = true;
}

if (REQUIRE_PRIVATE_DENYLIST && (!privateDenylistLoaded || privateDenylistRuleCount === 0)) {
  const error = privateDenylistLoaded
    ? 'Leak guard: private denylist required but no private scan rules were loaded.'
    : 'Leak guard: private denylist required but no private denylist was loaded.';
  if (JSON_OUT) {
    console.log(JSON.stringify({
      scanned: 0,
      violations: [],
      binaryFiles: [],
      privateDenylistLoaded,
      privateDenylistRuleCount,
      requirePrivateDenylist: REQUIRE_PRIVATE_DENYLIST,
      error
    }, null, 2));
  } else {
    console.error(error);
    console.error('Set STROKE_LEAK_GUARD_PRIVATE_DENYLIST or create scripts/leak-guard-denylist.local.json.');
  }
  process.exit(1);
}

const exemptFiles = new Set(denylist.exemptFiles || []);
const fullyExemptFiles = new Set(denylist.fullyExemptFiles || []);
const instExcludeDirs = denylist.institutionalScanExcludeDirs || [];
const binaryExt = new Set((denylist.binaryExtensions || []).map((e) => e.toLowerCase()));
const literals = denylist.literalDenylist || [];
const literalHashRules = denylist.literalSha256Denylist || [];
const allowedInstitutionalDisclaimerRules = (denylist.allowedInstitutionalDisclaimerPatterns || []).map((r) => ({
  re: new RegExp(r.pattern, r.flags || ''),
  label: r.label,
}));

// A file is exempt from the institution-NAME scan if it is explicitly listed or
// lives under a governance/test/CI dir. PHI patterns + literals are always scanned.
function institutionExempt(file) {
  return exemptFiles.has(file) || instExcludeDirs.some((d) => file.startsWith(d));
}

const institutionalRules = (denylist.institutionalTokens || []).map((r) => ({
  re: new RegExp(r.pattern, r.flags || ''),
  label: r.label,
}));
const phiRules = (denylist.phiPatterns || []).map((r) => ({
  re: new RegExp(r.pattern, r.flags || ''),
  label: r.label,
}));
const identityRules = (denylist.identityTokens || []).map((r) => ({
  re: new RegExp(r.pattern, r.flags || ''),
  label: r.label,
}));

const literalHashMaps = literalHashRules.reduce((acc, rule) => {
  const normalization = rule.normalization || 'text';
  if (!acc[normalization]) acc[normalization] = new Map();
  const list = acc[normalization].get(rule.sha256) || [];
  list.push({
    tier: rule.tier || 'phi',
    label: rule.label || 'protected literal hash',
    normalization,
  });
  acc[normalization].set(rule.sha256, list);
  return acc;
}, {});

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function normalizeTextCandidate(value) {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function normalizeDigitsCandidate(value) {
  return value.replace(/\D/g, '');
}

function shouldSkipHashRule(_rule, _file) {
  return false;
}

function addCandidate(set, candidate) {
  const trimmed = candidate.trim();
  if (trimmed.length >= 2) set.add(trimmed);
}

function candidateTextPhrases(line) {
  const candidates = new Set();
  const tokens = line.match(/[A-Za-z0-9_./'-]+/g) || [];
  const maxPhraseTokens = 8;
  for (let i = 0; i < tokens.length; i += 1) {
    for (let n = 1; n <= maxPhraseTokens && i + n <= tokens.length; n += 1) {
      addCandidate(candidates, tokens.slice(i, i + n).join(' '));
    }
  }
  for (const quoted of line.matchAll(/["'`](.{2,120}?)["'`]/g)) {
    addCandidate(candidates, quoted[1]);
  }
  return candidates;
}

function candidateDigitStrings(line) {
  const candidates = new Set();
  for (const match of line.matchAll(/\b\d[\d\s.-]{2,}\d\b/g)) {
    const digits = normalizeDigitsCandidate(match[0]);
    if (digits.length >= 4) candidates.add(digits);
  }
  return candidates;
}

function literalHashViolationsForLine(line, file) {
  const hits = [];
  const seen = new Set();

  if (literalHashMaps.text) {
    for (const candidate of candidateTextPhrases(line)) {
      const normalized = normalizeTextCandidate(candidate);
      const hashHits = literalHashMaps.text.get(sha256(normalized));
      if (!hashHits) continue;
      for (const rule of hashHits) {
        if (shouldSkipHashRule(rule, file)) continue;
        const key = `${rule.tier}:${rule.label}:${rule.normalization}`;
        if (seen.has(key)) continue;
        seen.add(key);
        hits.push(rule);
      }
    }
  }

  if (literalHashMaps.digits) {
    for (const digits of candidateDigitStrings(line)) {
      const hashHits = literalHashMaps.digits.get(sha256(digits));
      if (!hashHits) continue;
      for (const rule of hashHits) {
        if (shouldSkipHashRule(rule, file)) continue;
        const key = `${rule.tier}:${rule.label}:${rule.normalization}`;
        if (seen.has(key)) continue;
        seen.add(key);
        hits.push(rule);
      }
    }
  }

  return hits;
}

// File list on stdin (fd 0), newline-delimited; tolerate NUL just in case.
function readFileList() {
  let raw = '';
  try {
    raw = fs.readFileSync(0, 'utf8');
  } catch {
    raw = '';
  }
  const fromArgv = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const fromStdin = raw.split(/[\r\n\0]+/);
  return [...fromArgv, ...fromStdin].map((s) => s.trim()).filter(Boolean);
}

function isBinary(file) {
  return binaryExt.has(path.extname(file).toLowerCase());
}

function isAllowedInstitutionalDisclaimer(line) {
  return allowedInstitutionalDisclaimerRules.some((rule) => rule.re.test(line));
}

const violations = [];
const binaryFiles = [];
let scanned = 0;

for (const file of readFileList()) {
  if (fullyExemptFiles.has(file)) continue; // the guard's own ruleset/source/hook
  const abs = path.join(ROOT, file);
  if (!fs.existsSync(abs)) continue;
  if (fs.statSync(abs).isDirectory()) continue;
  if (isBinary(file)) {
    binaryFiles.push(file);
    continue;
  }
  let text;
  try {
    text = fs.readFileSync(abs, 'utf8');
  } catch {
    continue;
  }
  scanned += 1;
  const lines = text.split('\n');
  const exempt = institutionExempt(file);

  lines.forEach((line, idx) => {
    if (!exempt) {
      for (const rule of institutionalRules) {
        if (rule.re.test(line) && !isAllowedInstitutionalDisclaimer(line)) {
          violations.push({
            file,
            line: idx + 1,
            tier: 'institutional',
            label: rule.label,
            text: '[redacted institutional-pattern match on this line]',
          });
        }
      }
    }
    for (const rule of phiRules) {
      if (rule.re.test(line)) {
        violations.push({
          file,
          line: idx + 1,
          tier: 'phi',
          label: rule.label,
          text: '[redacted PHI-pattern match on this line]',
        });
      }
    }
    for (const rule of identityRules) {
      if (rule.re.test(line)) {
        violations.push({
          file,
          line: idx + 1,
          tier: 'identity',
          label: rule.label,
          text: '[redacted identity-pattern match on this line]',
        });
      }
    }
    for (const lit of literals) {
      if (line.includes(lit)) {
        violations.push({
          file,
          line: idx + 1,
          tier: 'phi',
          label: 'Literal denylist match',
          text: '[redacted literal-denylist match on this line]',
        });
      }
    }
    for (const rule of literalHashViolationsForLine(line, file)) {
      violations.push({
        file,
        line: idx + 1,
        tier: rule.tier,
        label: `Literal hash denylist: ${rule.label}`,
        text: '[redacted hash-denylist match on this line]',
      });
    }
  });
}

if (JSON_OUT) {
  console.log(JSON.stringify({
    scanned,
    violations,
    binaryFiles,
    privateDenylistLoaded,
    privateDenylistRuleCount,
    requirePrivateDenylist: REQUIRE_PRIVATE_DENYLIST
  }, null, 2));
} else {
  console.log(`Leak guard: scanned ${scanned} text file(s).`);
  if (!privateDenylistLoaded) {
    console.warn('\n⚠️  Public-only leak scan: no private exact-token denylist was loaded.');
  }
  if (binaryFiles.length) {
    console.log(`\n⚠️  ${binaryFiles.length} tracked binary file(s) not text-scanned (review manually if any could carry institutional content):`);
    for (const f of binaryFiles.slice(0, 40)) console.log(`   • ${f}`);
    if (binaryFiles.length > 40) console.log(`   … and ${binaryFiles.length - 40} more`);
  }
  if (violations.length) {
    console.error(`\n❌ ${violations.length} institutional / PHI-adjacent leak(s) found:\n`);
    for (const v of violations) {
      console.error(`   [${v.tier}] ${v.file}:${v.line} — ${v.label}`);
      console.error(`        ${v.text}`);
    }
    console.error(`\nProtected local or identity-bearing content must stay out of public source and build artifacts.`);
    console.error(`If a match is a legitimate citation/author or generic term, refine the pattern or add the file`);
    console.error(`to exemptFiles in scripts/leak-guard-denylist.json.`);
  } else {
    console.log('\n✅ No institutional / PHI-adjacent content found.');
  }
}

process.exit(violations.length ? 1 : 0);
