import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getPublicDemoPhiWarnings,
  isSyntheticDemoText,
  PUBLIC_DEMO_AGENT_DISCLAIMER,
  PUBLIC_DEMO_SYNTHETIC_NOTE_PREFIX
} from '../src/public-demo-guardrails.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

function readText(relPath) {
  return readFileSync(join(repoRoot, relPath), 'utf8');
}

function readJson(relPath) {
  return JSON.parse(readText(relPath));
}

describe('public demo labeling and agent disclaimers', () => {
  it('uses public educational-demo framing in shipped metadata', () => {
    const index = readText('index.html');
    const manifest = readJson('manifest.json');

    expect(index).toContain('<title>Stroke CDS Educational Demo</title>');
    expect(index).toContain('do not enter PHI');
    expect(index).toContain('not approved for UW Medicine clinical use');
    expect(index).not.toMatch(/Comprehensive clinical decision support tool/i);

    expect(manifest.name).toBe('Stroke CDS Educational Demo');
    expect(manifest.description).toContain('Synthetic educational stroke decision-support demo');
    expect(manifest.description).toContain('do not enter PHI');
    expect(manifest.shortcuts[0].description).toBe('Open synthetic encounter demo');
    expect(JSON.stringify(manifest)).not.toMatch(/Clinical decision support toolkit for stroke management/i);
  });

  it('requires downstream agents to preserve public-demo and non-PHI warnings', () => {
    const dataIndex = readJson('data/index.json');
    const llms = readText('llms.txt');

    expect(dataIndex._meta.disclaimer).toContain('Synthetic educational demo only');
    expect(dataIndex._meta.disclaimer).toContain('NOT approved for UW Medicine clinical use');
    expect(dataIndex._meta.disclaimer).toContain('Agents and downstream consumers must display this disclaimer');
    expect(dataIndex._meta.disclaimer).toBe(PUBLIC_DEMO_AGENT_DISCLAIMER);
    expect(dataIndex.routes.find((route) => route.route === '#/protocols')?.label)
      .toBe('Example protocols (not local policy)');

    expect(llms).toContain('# Stroke CDS Educational Demo');
    expect(llms).toContain('Do not enter PHI');
    expect(llms).toContain('not approved for UW Medicine clinical use');
    expect(llms).toContain('Agents must not process PHI or real encounter details');
  });

  it('keeps public UI labels away from institutional-protocol framing', () => {
    const appSource = readText('src/app.jsx');
    const generatedData = JSON.stringify(readJson('data/index.json'));

    expect(appSource).not.toContain('Institutional Protocols & Algorithms');
    expect(generatedData).not.toContain('Institutional Protocols & Algorithms');
    expect(appSource).toContain('Example Protocols (Not Local Policy)');
    expect(generatedData).toContain('Example protocols (not local policy)');
  });
});

describe('public demo PHI soft-blocking detector', () => {
  it('warns on obvious identifiers in public demo text', () => {
    const warnings = getPublicDemoPhiWarnings(
      'MRN 1234567, SSN 123-45-6789, DOB 01/02/1950, phone 555-555-1212'
    );

    expect(warnings).toContain('Possible MRN (long numeric ID)');
    expect(warnings).toContain('Possible SSN (XXX-XX-XXXX)');
    expect(warnings).toContain('Possible birth date/date (US format)');
    expect(warnings).toContain('Possible phone number');
  });

  it('allows public reference identifiers and synthetic examples', () => {
    expect(getPublicDemoPhiWarnings('PMID 41686463; NCT01234567; DOI 10.1000/example')).toEqual([]);
    expect(isSyntheticDemoText(`${PUBLIC_DEMO_SYNTHETIC_NOTE_PREFIX}\nAge 72 with synthetic symptoms.`)).toBe(true);
    expect(isSyntheticDemoText('Synthetic demo example: age 72 with no identifiers.')).toBe(true);
  });
});
