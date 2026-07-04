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

function lines(relPath) {
  return readText(relPath).split(/\r?\n/).map((line) => line.trim());
}

describe('public demo labeling and agent disclaimers', () => {
  it('uses public educational-demo framing in shipped metadata', () => {
    const index = readText('index.html');
    const manifest = readJson('manifest.json');

    expect(index).toContain('<title>Stroke CDS Educational Demo</title>');
    expect(index).toContain('do not enter PHI');
    expect(index).toContain('not an approved clinical tool');
    expect(index).not.toMatch(/UW Medicine/i);
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
    expect(dataIndex._meta.disclaimer).toContain('NOT an approved clinical tool');
    expect(dataIndex._meta.disclaimer).toContain('Agents and downstream consumers must display this disclaimer');
    expect(dataIndex._meta.disclaimer).toBe(PUBLIC_DEMO_AGENT_DISCLAIMER);
    expect(dataIndex.routes.find((route) => route.route === '#/protocols')?.label)
      .toBe('Example protocols (not local policy)');

    expect(llms).toContain('# Stroke CDS Educational Demo');
    expect(llms).toContain('Do not enter PHI');
    expect(llms).toContain('not an approved clinical tool');
    expect(llms).toContain('Agents must not process PHI or real encounter details');
    expect(llms).not.toMatch(/UW Medicine/i);
  });

  it('keeps served metadata free of institution and maintainer identity', () => {
    // The site is hosted at rkalani1.github.io (the GitHub Pages origin), so the
    // bare account slug is unavoidable in canonical URLs. Everything else —
    // institution names, personal names, institutional email domains — is banned
    // from the served metadata surface.
    const IDENTITY = new RegExp([
      'UW Medicine',
      'Harborview',
      ['university', 'of', 'washington'].join(' '),
      ['washington', 'edu'].join('\\.'),
      '\\b' + ['uw', 'edu'].join('\\.') + '\\b',
      'Riz' + 'wan',
      'Ka' + 'lani(?!1)'
    ].join('|'), 'i');
    for (const relPath of ['index.html', 'manifest.json', 'llms.txt', 'llms-full.txt', 'robots.txt', 'sitemap.xml', 'README.md', 'COMPLIANCE.md', 'SECURITY.md']) {
      const content = readText(relPath);
      expect(content, `${relPath} leaks identity/institution content`).not.toMatch(IDENTITY);
    }
    expect(JSON.stringify(readJson('data/index.json'))).not.toMatch(IDENTITY);
    expect(JSON.stringify(readJson('whats-new.json'))).not.toMatch(IDENTITY);
  });

  it('keeps public UI labels away from institutional-protocol framing', () => {
    const appSource = readText('src/app.jsx');
    const generatedData = JSON.stringify(readJson('data/index.json'));

    expect(appSource).not.toContain('Institutional Protocols & Algorithms');
    expect(generatedData).not.toContain('Institutional Protocols & Algorithms');
    expect(appSource).toContain('Example Protocols (Not Local Policy)');
    expect(generatedData).toContain('Example protocols (not local policy)');
  });

  it('excludes source, tests, scripts, docs, and local-only folders from GitHub Pages', () => {
    const configLines = lines('_config.yml');
    const excluded = [
      'scripts/',
      'src/',
      'tests/',
      'docs/',
      'android/',
      'ios/',
      'mcp/',
      'output/',
      'private/',
      'node_modules/',
      '.github/',
      '.githooks/'
    ];

    for (const path of excluded) {
      expect(configLines).toContain(`- ${path}`);
    }
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
