import { describe, expect, it } from 'vitest';
import { buildTableMarkdown } from '../src/components/EligibilityTables.jsx';
import { screenerTrials } from '../src/evidence/screenerTrials.js';
import { eligibilityTables } from '../src/evidence/eligibilityTables.js';
import { createInitialScreenerState, evaluateAll } from '../src/evidence/screener-eval.js';

const trial = acronym => screenerTrials.find(item => item.acronym === acronym);
const state = patch => ({ ...createInitialScreenerState(), ...patch });

describe('STEP screening summary preserves imaging checks as manual confirmations', () => {
  it('surfaces repeat-imaging and territory/core thresholds for an otherwise modeled match', () => {
    const result = evaluateAll(state({ classification: 'ischemic', onsetVal: 8, onsetUnit: 'hours', age: 60, preMrs: 1, aspects: 9, vessel: 'm2_m3_nd', nihss: 10 }));
    const step = [...result.pending, ...result.eligible].find(item => item.trial.acronym === 'STEP');
    expect(step).toBeDefined();
    const confirm = step.pendingCriteria.join('\n');
    expect(confirm).toContain('M2 must serve <50% of the entire MCA territory');
    expect(confirm).toContain('Tmax >4 seconds');
    expect(confirm).toContain('for either M2 or M3');
    expect(confirm).toContain('ADC <620 on diffusion MRI (confirm the registry-reported threshold and protocol units)');
    expect(confirm).toContain('>120 minutes');
    expect(confirm).toContain('NIHSS 0-5, repeat only with significant NIHSS improvement');
    expect(result.briefingNote).toContain('Tmax >4 seconds');
    expect(trial('STEP').sourceGaps.join('\n')).toContain('summary uses ≤50% for M2 territory, while the registry record uses <50%');
    expect(trial('STEP')).not.toHaveProperty('localActivation');
  });
});

describe('DISCOVERY is a registry reference rather than an automated eligibility screen', () => {
  it('retains the full core and tier-specific criteria without asserting site activation', () => {
    const discovery = trial('DISCOVERY');
    expect(discovery.referenceOnly).toBe(true);
    expect(discovery.externalMetadata).toMatchObject({ nct: 'NCT04916210', studyType: 'OBSERVATIONAL', registryStatus: 'RECRUITING', verificationDate: '2026-11-04', registryLastUpdatePosted: '2026-09-14' });
    expect(discovery.exactInclusionCriteria).toHaveLength(6);
    expect(discovery.exactInclusionCriteria.join('\n')).toMatch(/within 6 weeks of stroke onset/);
    expect(discovery.exactInclusionCriteria.join('\n')).toContain('informed consent by self or proxy');
    const exclusions = discovery.exactExclusionCriteria.join('\n');
    expect(discovery.exactExclusionCriteria).toHaveLength(7);
    expect(exclusions).toContain('Additional exclusion for Tier 2 participants: Contraindication to MRI');
    expect(exclusions).toContain('Additional exclusion for Tier 3 participants: Age <50 years');
    expect(exclusions).toContain('pregnant or seeking to become pregnant');
    expect(exclusions).toContain("Cowden disease, Lynch syndrome, hypogammaglobulinemia, Wiskott-Aldrich syndrome, Down's syndrome");
    expect(discovery).not.toHaveProperty('localActivation');
  });

  it('appears in ischemic and ICH phase references but never in candidate results', () => {
    expect(eligibilityTables.filter(table => table.trials.some(item => item.acronym === 'DISCOVERY')).map(table => table.id)).toEqual(['ischemic-inpatient', 'ischemic-outpatient', 'ich-inpatient', 'ich-outpatient']);
    for (const classification of ['ischemic', 'ich', 'tia']) {
      const results = evaluateAll(state({ classification, onsetVal: 7, onsetUnit: 'days', age: 60 }));
      expect([...results.pending, ...results.eligible, ...results.soon, ...results.excluded].map(item => item.trial.acronym)).not.toContain('DISCOVERY');
      expect(results.briefingNote).not.toContain('DISCOVERY');
    }
    const reference = eligibilityTables.find(table => table.id === 'ich-inpatient');
    expect(buildTableMarkdown(reference)).toContain('DISCOVERY NCT04916210');
    expect(buildTableMarkdown(reference)).toContain('not modeled in the screener');
  });
});


describe('public profiles keep local participation private', () => {
  it('contains no local activation record and retains the unconfirmed public scope', () => {
    for (const profile of screenerTrials) {
      expect(profile).not.toHaveProperty('localActivation');
      expect(profile.externalMetadata.localActivationStatus).toBe('not_assessed');
    }
    expect(evaluateAll(state({ classification: 'ich' })).briefingNote).toContain('local site activation is not confirmed.');
  });
});
