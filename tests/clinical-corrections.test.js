// Regression lock for the clinical-content corrections applied on 2026-07-11
// (audit-flagged factual errors, none in the frozen Example Protocols zone).
// Source-scan style (robust across the JSX/JSON mix) — each guard fails if a
// known-wrong phrasing reappears or the corrected value goes missing.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(repoRoot, rel), 'utf8');

describe('clinical corrections (regression lock)', () => {
  it('THALES is 30 days, not attributed to the 90-day DAPT option', () => {
    const app = read('src/app.jsx');
    expect(app).not.toContain('90 days (CHANCE-2/THALES)');
    expect(app).toContain('90 days (CHANCE-2)');
    expect(app).toContain('30 days (THALES)');
  });

  it('ICH Score 4 mortality is 97% (Hemphill), not 94%, in the education card', () => {
    const edu = read('src/education.jsx');
    expect(edu).toContain('case 4: return "97%"');
    expect(edu).not.toContain('case 4: return "94%"');
    // display tile
    expect(edu).not.toMatch(/<strong>4<\/strong><br\/><span[^>]*>94%<\/span>/);
  });

  it('HINTS peripheral pattern is abnormal HIT + unidirectional nystagmus (not the central signs)', () => {
    const t = read('src/teaching.js');
    // the old, wrong wording labelled central signs as "peripheral"
    expect(t).not.toContain('peripheral: normal head impulse + direction-changing nystagmus');
    expect(t).toContain('abnormal head impulse (corrective saccade) + unidirectional nystagmus + normal skew');
  });

  it('TREAT-CAD did NOT confirm aspirin non-inferiority', () => {
    const lm = read('src/guidelines/landmark-trials.json');
    expect(lm).not.toContain('TREAT-CAD: ASA non-inferior for primary endpoint');
    expect(lm).not.toContain('Aspirin non-inferior to warfarin for cervical dissection.');
    expect(lm).toContain('did NOT meet non-inferiority');

    const comp = read('src/components.jsx');
    expect(comp).not.toContain('ASA (TREAT-CAD 2021) non-inferior to VKA for 3 months');
    expect(comp).toContain('did not confirm ASA non-inferiority');
  });

  it('mannitol osmolar-gap hold threshold is >20, not >55', () => {
    const evd = read('src/simulators/EvdIcpSimulator.jsx');
    expect(evd).not.toContain('Osm Gap &gt; 55');
    expect(evd).toContain('Osm Gap &gt; 20');
  });

  it('AF-timing pearl aligns with the canonical ELAN/OPTIMAS/CATALYST model', () => {
    const app = read('src/app.jsx');
    // old pearl mislabelled a later scheme as ELAN/CATALYST with severe day 6-14
    expect(app).not.toContain('severe (NIHSS ≥16): day 6-14 with repeat imaging');
    expect(app).toContain('≤4 days reasonable across severities');
  });
});
