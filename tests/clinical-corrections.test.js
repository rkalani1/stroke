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
    // CHANCE-2 gave ticagrelor + aspirin for 21 days (aspirin stopped at day 21);
    // the 90-day DAPT arm is POINT (clopidogrel + aspirin, PMID 29766750).
    expect(app).not.toContain('90 days (CHANCE-2)');
    expect(app).toContain('90 days (POINT');
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
    expect(t).not.toContain('normal/bilateral HIT');
    expect(t).toContain('clinician trained in its use');
    expect(t).toContain('MRI/MRA for a central or equivocal result');
    expect(t).toContain('An abnormal head impulse or new hearing loss alone does not exclude stroke');
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

  it('withholds the unvalidated universal osmolar-gap recipe', () => {
    const evd = read('src/simulators/EvdIcpSimulator.jsx');
    const education = read('src/education.jsx');
    expect(evd).not.toMatch(/gap &gt; (20|55)/i);
    expect(evd).toContain('No validated simulation result');
    expect(education).toContain('abbreviated osmotherapy, sedation and procedural recipes are unavailable');
    expect(education).toContain('32227294');
  });

  it('allowed AF-timing guidance uses imaging-defined evidence without a universal early-start rule', () => {
    const app = read('src/app.jsx');
    // old pearl mislabelled a later scheme as ELAN/CATALYST with severe day 6-14
    expect(app).not.toContain('severe (NIHSS ≥16): day 6-14 with repeat imaging');
    expect(app).not.toContain('≤4 days reasonable across severities');
    expect(app).toContain('ELAN classified stroke severity by infarct size and territory on imaging, not NIHSS');
    expect(app).toContain('No automatic start recommendation is generated');
  });
});
