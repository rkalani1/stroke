// Pure (no-browser) validation of the /content data layer against its schema.
// Mirrors scripts/validate-content.mjs but runs inside vitest so a malformed
// content edit fails `npm run test:unit`, not just the build gate.

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { citations } from '../src/evidence/citations.js';
import {
  VALIDATORS, parseFrontmatter, PMID_PATTERN,
} from '../content/schema.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(__dirname, '..');
const CONTENT = path.join(REPO, 'content');

const ctx = {
  citationIds: new Set(citations.map((c) => c.id)),
  pmids: new Set(citations.map((c) => c.pmid).filter(Boolean)),
  dois: new Set(citations.map((c) => c.doi).filter(Boolean)),
  calculatorIds: new Set(
    JSON.parse(fs.readFileSync(path.join(CONTENT, 'calculators', 'registry.json'), 'utf8')).map((c) => c.id)
  ),
  now: new Date(),
  maxAgeMonths: 18,
  staleIsError: false, // currency is a warning inside the unit suite; the build gate enforces it
};

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (p.endsWith('.json') || p.endsWith('.md')) out.push(p);
  }
  return out;
}

// Only files inside a known domain directory are records; top-level content
// files (bundle.json, CHANGELOG.md, schema.mjs) and _-drafts are not.
function isRecordFile(file) {
  const rel = path.relative(CONTENT, file).split(path.sep);
  return rel.length >= 2 && VALIDATORS[rel[0]] && !rel[0].startsWith('_');
}

function recordsOf(file) {
  if (file.endsWith('.json')) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return (Array.isArray(data) ? data : [data]).map((rec, i) => [rec, `[${i}]`]);
  }
  return [[parseFrontmatter(fs.readFileSync(file, 'utf8')).data, '']];
}

const files = walk(CONTENT).filter(isRecordFile);

describe('/content data layer', () => {
  it('has all five content domains populated', () => {
    for (const domain of ['guidelines', 'trials', 'education', 'calculators', 'references']) {
      const dir = path.join(CONTENT, domain);
      expect(fs.existsSync(dir), `${domain}/ should exist`).toBe(true);
      expect(fs.readdirSync(dir).length, `${domain}/ should have files`).toBeGreaterThan(0);
    }
  });

  for (const file of files) {
    const rel = path.relative(REPO, file);
    const domain = path.relative(CONTENT, file).split(path.sep)[0];
    const validate = VALIDATORS[domain];
    it(`validates ${rel}`, () => {
      expect(validate, `no validator for ${domain}`).toBeTruthy();
      for (const [rec, idx] of recordsOf(file)) {
        const { errors } = validate(rec, ctx);
        expect(errors, `${rel}${idx}: ${errors.join('; ')}`).toEqual([]);
      }
    });
  }

  it('every content citation resolves in the single citations registry', () => {
    const unresolved = [];
    for (const file of files) {
      for (const [rec] of recordsOf(file)) {
        for (const id of rec.citationIds || []) {
          if (!ctx.citationIds.has(id)) unresolved.push(`${path.relative(REPO, file)}: ${id}`);
        }
        for (const pmid of rec.PMIDs || []) {
          if (!PMID_PATTERN.test(pmid)) unresolved.push(`${path.relative(REPO, file)}: bad PMID ${pmid}`);
        }
      }
    }
    expect(unresolved).toEqual([]);
  });
});
