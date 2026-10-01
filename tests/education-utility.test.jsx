import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as education from '../src/education.jsx';
import { DOWNLOAD_MANIFEST, MAINTAINED_DOWNLOADS, HISTORICAL_DOWNLOADS, RETIRED_DOWNLOADS } from '../src/download-manifest.js';
import { ICH_HISTORICAL_COHORT, ICH_COHORT_HEADING, ICH_COHORT_LIMIT, historicalIchMortality } from '../src/clinical-prognosis-content.js';
import { getClinicalClaim } from '../src/clinical/claim-registry.js';

const render = (Component) => renderToStaticMarkup(<Component />);
function pdfFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? pdfFiles(path) : path.endsWith('.pdf') ? [path] : [];
  });
}

describe('Reference first, deliberate prognosis teaching', () => {
  it('opens the score reference without mounting preset inputs at any viewport', () => {
    const html = render(education.StrokePrognosisView);
    expect(html).toMatch(/aria-pressed="true"[^>]*>Score reference<\/button>/);
    expect(html).toMatch(/aria-pressed="false"[^>]*>Teaching examples<\/button>/);
    expect(html).not.toMatch(/<input|role="switch"|Bedside Calculator|Reset teaching example/);
    expect(html).toContain(ICH_COHORT_HEADING);
    expect(html).toContain(ICH_COHORT_LIMIT);
    expect(html).not.toContain('?v=6.9.24');
  });

  it('names synthetic preset inputs before the explorer and preserves withheld model outputs', () => {
    const html = render(education.StrokePrognosisCalculator);
    expect(html).toContain('Teaching examples · Historical score explorer');
    expect(html).toContain('Pre-filled synthetic teaching examples');
    expect(html).toContain('these inputs are not linked to an encounter');
    expect(html.indexOf('Pre-filled synthetic teaching examples')).toBeLessThan(html.indexOf('<input'));
    expect(html).toContain(ICH_COHORT_HEADING);
    expect(html).toContain(ICH_COHORT_LIMIT);
    expect(html).not.toContain('30d Mortality Risk');
    expect(education.getAstralRisk(50)).toBeNull();
    expect(education.getPlanRisk(10).available).toBe(false);
  });

  it('uses the same historical values and limitations for the explorer and printable card', () => {
    const html = render(education.StrokePrognosisCard);
    for (const { score, mortality } of ICH_HISTORICAL_COHORT) {
      expect(education.getIchRisk(score)).toBe(mortality);
      expect(html).toContain(`>${mortality}</span>`);
    }
    for (const value of [6, -1, null, undefined, '0', 0.5, NaN]) {
      expect(historicalIchMortality(value)).toBe('Not estimated');
    }
    expect(html).toContain(getClinicalClaim('prognostic-score-limits').text);
    expect(html).toContain(ICH_COHORT_LIMIT);
  });
});

describe('Finite download lifecycle', () => {
  it('accounts for every published PDF exactly once without withdrawing historical sources', () => {
    expect(MAINTAINED_DOWNLOADS).toHaveLength(7);
    expect(HISTORICAL_DOWNLOADS).toHaveLength(17);
    expect(DOWNLOAD_MANIFEST.map((entry) => entry.path).sort()).toEqual(pdfFiles('documents').sort());
    expect(new Set(DOWNLOAD_MANIFEST.map((entry) => entry.id)).size).toBe(DOWNLOAD_MANIFEST.length);
    expect(RETIRED_DOWNLOADS.every((retired) => !DOWNLOAD_MANIFEST.some((entry) => entry.path === retired.path))).toBe(true);
  });

  it('permits generation only from each maintained entry’s canonical education component', () => {
    for (const entry of MAINTAINED_DOWNLOADS) {
      expect(entry.sourcePath).toBe('src/education.jsx');
      expect(typeof education[entry.component]).toBe('function');
      expect(entry.path).toMatch(/^documents\/references\/[^/]+\.pdf$/);
      expect(entry.educationModuleId).toBeTruthy();
    }
    expect(HISTORICAL_DOWNLOADS.every((entry) => !entry.component && !entry.sourcePath)).toBe(true);
    const exporter = readFileSync('scripts/generate-pdfs.mjs', 'utf8');
    expect(exporter).toContain('const destinations = MAINTAINED_DOWNLOADS');
    expect(exporter).toContain('--output-dir');
  });
});
