import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');
const source = read('src/protocols/source-of-truth.js');
const component = read('src/protocols/StrokeCenterProtocols.jsx');
const built = read('app.js');
const agentBundle = JSON.parse(read('data/generic-protocols.json'));
const bundleText = JSON.stringify(agentBundle.data);
const currentSurface = `${source}\n${component}\n${bundleText}`;

describe('current protocol source-set guards', () => {
  it('publishes the reviewed source policy and current revision dates', () => {
    expect(agentBundle._meta.source).toBe('De-identified current protocol source bundle');
    expect(agentBundle.data.metadata.reviewedOn).toBe('2026-08-16');
    expect(agentBundle.data.metadata.newestAuthoritativeRevision).toBe('August 2026');
    expect(agentBundle.data.metadata.sourcePolicy).toMatch(/Only the approved protocol source set was used/i);
    expect(bundleText).toMatch(/Acute stroke algorithm.*July 2026/i);
    expect(bundleText).toMatch(/IV thrombolytic information form.*August 2026/i);
    expect(bundleText).toMatch(/Pediatric stroke framework.*June 2026/i);
  });

  it('locks the current reperfusion values', () => {
    expect(currentSurface).toMatch(/Tenecteplase: 0\.25 mg\/kg IV bolus, maximum 25 mg/i);
    expect(currentSurface).toMatch(/Alteplase alternative: 0\.9 mg\/kg IV, maximum 90 mg/i);
    expect(currentSurface).toMatch(/core less than 50 mL.*mismatch ratio at least 1\.2.*penumbra at least 10 mL.*baseline mRS 0–1/is);
    expect(currentSurface).toMatch(/NIHSS at least 6.*less than 24 hours.*ICA, MCA, or basilar/is);
    expect(currentSurface).not.toMatch(/0\.4\s*mg\/kg/i);
  });

  it('locks source-derived blood-pressure and reversal values', () => {
    expect(currentSurface).toMatch(/Before IV thrombolysis.*Below 185\/110 mm Hg/is);
    expect(currentSurface).toMatch(/After IV thrombolysis.*Below 180\/105 mm Hg/is);
    expect(currentSurface).toMatch(/After thrombectomy.*140–180 mm Hg systolic.*avoid below 140/is);
    expect(currentSurface).toMatch(/Initial SBP 150–219 mm Hg.*Target 130–150 mm Hg/is);
    expect(currentSurface).toMatch(/Warfarin.*Vitamin K 10 mg IV plus four-factor PCC 2,000 units IV/is);
    expect(currentSurface).toMatch(/Factor-Xa inhibitor.*PCC 2,000 units IV/is);
    expect(currentSurface).not.toMatch(/PCC.{0,80}(25|35|50)\s*(units|unit)\/kg/i);
  });

  it('locks current complication treatment values', () => {
    expect(currentSurface).toMatch(/2 units of cryoprecipitate.*tranexamic acid 1,000 mg IV over 10 minutes/is);
    expect(currentSurface).toMatch(/methylprednisolone 125 mg IV.*diphenhydramine 50 mg IV/is);
    expect(currentSurface).toMatch(/epinephrine 0\.1% solution, 0\.3 mL subcutaneously, or 0\.5 mL by nebulization/i);
    expect(currentSurface).not.toMatch(/2\s+pools?\s+of\s+cryoprecipitate/i);
  });

  it('keeps pediatric thresholds explicitly source-limited', () => {
    expect(currentSurface).toMatch(/Age under 2 years is a contraindication/i);
    expect(currentSurface).toMatch(/Age 6 years or older is the preferred threshold.*caution at ages 4–5/is);
    expect(currentSurface).toMatch(/ASPECTS at least 3 through 6 hours.*at least 6 from 6–24 hours/is);
    expect(currentSurface).toMatch(/educational framework, not a stand-alone telephone treatment protocol/i);
  });

  it('makes source gaps and excluded drafts visible', () => {
    expect(currentSurface).toMatch(/No current CVT algorithm, protocol, or approved recommendation was found/i);
    expect(currentSurface).toMatch(/absence of an approved source is visible rather than silently replaced with outside guidance/i);
    expect(agentBundle.data.excludedPendingSources).toHaveLength(3);
    expect(bundleText).toMatch(/proposed direct-to-procedure workflow was excluded/i);
    expect(bundleText).toMatch(/working draft/i);
  });

  it('ships only the source-backed protocol calculators', () => {
    expect(agentBundle.data.calculators.map((calculator) => calculator.id)).toEqual([
      'gcs', 'abcd2', 'ich', 'abc2', 'cha2ds2vasc'
    ]);
    expect(component).toContain("'Not calculated'");
    expect(currentSurface).not.toMatch(/PHQ-?9|modified Fisher|enoxaparin dose|CrCl calculator/i);
  });

  it('builds the new protocol surface and drops the disabled legacy branch', () => {
    expect(built).toContain('De-identified current protocol translation');
    expect(built).toContain('Only the approved protocol source set was used');
    expect(built).toContain('Source gap confirmed during August 2026 reconciliation');
    expect(built).not.toContain('NON-PUBLIC EXTENSION LAYER');
  });
});
