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
const sentinel = (...parts) => parts.join('_');
const syntheticPrivateOrg = new RegExp(sentinel('PUBLIC', 'PRIVATE', 'INSTITUTION', 'SENTINEL'), 'i');

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
    expect(index).not.toMatch(syntheticPrivateOrg);
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
    expect(llms).not.toMatch(syntheticPrivateOrg);
  });

  it('keeps served metadata free of institution and maintainer identity', () => {
    // The site is hosted at rkalani1.github.io (the GitHub Pages origin), so the
    // bare account slug is unavoidable in canonical URLs. Everything else --
    // institution names, personal names, institutional email domains — is banned
    // from the served metadata surface.
    const IDENTITY = new RegExp([
      sentinel('PUBLIC', 'PRIVATE', 'INSTITUTION', 'SENTINEL'),
      sentinel('PUBLIC', 'PRIVATE', 'IDENTITY', 'SENTINEL'),
      sentinel('PUBLIC', 'PRIVATE', 'LITERAL', 'SENTINEL')
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
    // Visible tab/palette label decluttered to "Example Protocols" (owner
    // decision); the machine-readable data route keeps the fuller
    // "not local policy" descriptor for agents.
    expect(appSource).toContain("name: 'Example Protocols'");
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
      'data/clinical-intelligence/',
      'node_modules/',
      '.github/',
      '.githooks/',
      'whats-new-source-gaps.md'
    ];

    for (const path of excluded) {
      expect(configLines).toContain(`- ${path}`);
    }
  });

  it('keeps shipped metadata and root HTML free of source/private path hints', () => {
    const forbidden = [
      ['private', 'institutional.js'].join('/'),
      'scripts/generate-splash.sh',
      'src/design/theme.js',
      'local/private',
      'repo /mcp',
      'src/institutional-protocols.js',
      'June 2026 IPH initial-evaluation figure and narrative algorithm'
    ];
    const shipped = [
      'index.html',
      'llms.txt',
      'llms-full.txt',
      'data/index.json',
      'data/generic-protocols.json',
      'data/management-cards.json',
      'data/calculators-index.json',
      'data/atlas/active-trials.json'
    ];

    for (const relPath of shipped) {
      const content = readText(relPath);
      for (const value of forbidden) {
        expect(content, `${relPath} exposes ${value}`).not.toContain(value);
      }
    }

    const manifest = readJson('data/index.json');
    const protocols = readJson('data/generic-protocols.json');
    expect(manifest.mcpServer).toBeNull();
    expect(protocols._meta.source).toBe('Public protocol reference bundle');
    expect(protocols.data.ichInitialEvaluation.sourceWindow)
      .toBe('Reviewed June 2026 public-safe algorithm translation');
  });
});

describe('public demo PHI soft-blocking detector', () => {
  it('warns on obvious identifiers in public demo text', () => {
    const warnings = getPublicDemoPhiWarnings(
      ['MRN 1234567, SSN 123-45-6789, DOB 01/02/1950, phone ', '555', '555', '1212'].join('-')
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
