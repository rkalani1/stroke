#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// LEAK GUARD — institutional / PHI-adjacent content scanner.
//
// Defense-in-depth layer #3 protecting the PUBLIC GitHub Pages build and repo:
//   1. .gitignore            → private/, src/institutional-protocols.local.js
//   2. index.html host-gate  → private/institutional.js is only injected off
//                              *.github.io hosts (never loaded on public Pages)
//   3. THIS SCRIPT           → fails the build if a real HMC/UW/Harborview
//                              identifier or PHI-adjacent token (phone, pager,
//                              keypad, EPIC order-set id) lands in a tracked file.
//                              Real institutional protocols belong ONLY in
//                              private/institutional.js (gitignored).
//
// The file list is fed on STDIN (newline-delimited) so this script never shells
// out — no child_process, no injection surface. The npm wrappers pipe git:
//   npm run check:leak-guard          (git ls-files            | node …)
//   npm run check:leak-guard:staged   (git diff --cached --name-only | node …)
// Add --json for machine-readable output.
//
// Two severity tiers (see leak-guard-denylist.json):
//   • institutionalTokens — banned on the served/source surface; allowed only in
//     meta/policy files listed under exemptFiles.
//   • phiPatterns + literalDenylist — banned in EVERY tracked file, no exemption.
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const args = new Set(process.argv.slice(2));
const JSON_OUT = args.has('--json');

const denylist = JSON.parse(
  fs.readFileSync(new URL('./leak-guard-denylist.json', import.meta.url), 'utf8'),
);

const exemptFiles = new Set(denylist.exemptFiles || []);
const fullyExemptFiles = new Set(denylist.fullyExemptFiles || []);
const instExcludeDirs = denylist.institutionalScanExcludeDirs || [];
const binaryExt = new Set((denylist.binaryExtensions || []).map((e) => e.toLowerCase()));
const literals = denylist.literalDenylist || [];

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
        if (rule.re.test(line)) {
          violations.push({ file, line: idx + 1, tier: 'institutional', label: rule.label, text: line.trim().slice(0, 160) });
        }
      }
    }
    for (const rule of phiRules) {
      if (rule.re.test(line)) {
        violations.push({ file, line: idx + 1, tier: 'phi', label: rule.label, text: line.trim().slice(0, 160) });
      }
    }
    for (const lit of literals) {
      if (line.includes(lit)) {
        violations.push({ file, line: idx + 1, tier: 'phi', label: `Literal denylist: ${lit}`, text: line.trim().slice(0, 160) });
      }
    }
  });
}

if (JSON_OUT) {
  console.log(JSON.stringify({ scanned, violations, binaryFiles }, null, 2));
} else {
  console.log(`Leak guard: scanned ${scanned} text file(s).`);
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
    console.error(`\nReal HMC/UW/Harborview content must live ONLY in private/institutional.js (gitignored).`);
    console.error(`If a match is a legitimate citation/author or generic term, refine the pattern or add the file`);
    console.error(`to exemptFiles in scripts/leak-guard-denylist.json.`);
  } else {
    console.log('\n✅ No institutional / PHI-adjacent content found.');
  }
}

process.exit(violations.length ? 1 : 0);
