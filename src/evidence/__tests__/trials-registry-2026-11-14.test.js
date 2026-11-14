// Regression specs for the 2026-11-14 Trials registry recheck. Expected values come from the
// ClinicalTrials.gov records read on 2026-11-14 (quoted below), not from the implementation output.
import { describe, expect, it } from 'vitest';
import { screenerTrials } from '../screenerTrials.js';
import { buildScreenerParams, createInitialScreenerState, evaluateTrialEligibility, numericFact } from '../screener-eval.js';
import { eligibilityTables } from '../eligibilityTables.js';
import { buildTableHtml, buildTableMarkdown } from '../../components/EligibilityTables.jsx';

const trial = acronym => screenerTrials.find(t => t.acronym === acronym);
const evaluate = (acronym, patch) => evaluateTrialEligibility(trial(acronym), buildScreenerParams({ ...createInitialScreenerState(), ...patch }, null));
// The classification and reasons; the matched-criteria line echoes the age as entered ("Age is 80.5").
const verdict = r => JSON.stringify({ status: r.status, exclusionReasons: r.exclusionReasons, failedFields: r.failedFields, pending: r.pendingCriteria, completeness: r.completeness });
const same = (a, b) => expect(verdict(a)).toBe(verdict(b));

describe('ages are completed years, as the registries state them', () => {
  // MINUTE "Age ≥ 18 and ≤ 80 years"; TELE-REHAB-2 "Age 18-85 years"; MR-PICS "22-75 years of age".
  it('reads a fractional age as the completed year', () => {
    expect(numericFact('age', 80.5)).toBe(80);
    expect(numericFact('age', '17.9')).toBe(17);
    expect(numericFact('age', 120.5)).toBeNull();
  });
  it('classifies 80.5 like 80 for MINUTE, 85.5 like 85 for TELE-REHAB-2 and 75.5 like 75 for MR-PICS', () => {
    for (const [acronym, classification, max] of [['MINUTE', 'ich', 80], ['TELE-REHAB-2', 'ischemic', 85], ['MR-PICS', 'ischemic', 75]]) {
      same(evaluate(acronym, { classification, age: max + 0.5 }), evaluate(acronym, { classification, age: max }));
      expect(verdict(evaluate(acronym, { classification, age: max + 1 }))).not.toBe(verdict(evaluate(acronym, { classification, age: max })));
    }
  });
  it('keeps a fractional age under a minimum below it', () => {
    same(evaluate('MINUTE', { classification: 'ich', age: 17.9 }), evaluate('MINUTE', { classification: 'ich', age: 17 }));
  });
});

describe('records updated after the 2026-10-31 check', () => {
  // Exact-day AREA[LastUpdatePostDate] queries on 2026-11-14; statuses and eligibility text unchanged.
  it('records the new last-update dates and the 2026-11-14 recheck', () => {
    for (const [acronym, status, posted] of [['TELE-REHAB-2', 'RECRUITING', '2026-11-05'], ['CAPTIVA', 'ACTIVE_NOT_RECRUITING', '2026-11-10'], ['CAPPRICORN-1', 'ACTIVE_NOT_RECRUITING', '2026-11-13']]) {
      const m = trial(acronym).externalMetadata;
      expect([m.verificationDate, m.registryStatus, m.registryLastUpdatePosted], acronym).toEqual(['2026-11-14', status, posted]);
      expect(trial(acronym).sourceGaps.filter(g => g.startsWith(`Registry status rechecked 2026-11-14: ${status}; last update posted ${posted} (recorded 2026-11-14)`)), acronym).toHaveLength(1);
    }
  });
});

describe('registry items without a stored rule are named for confirmation', () => {
  it.each([
    ['ASPIRE', 'ischemic', /highly effective contraception.*bleeding diathesis/],
    ['SATURN', 'ich', /noncompliance.*alcohol or drug dependency/],
    ['STEP', 'ischemic', /proven contraindication to endovascular thrombectomy/],
    ['TELE-REHAB-2', 'ischemic', /coexistent neurological, psychiatric or medical disease.*study procedures or therapy/]
  ])('%s lists them in its manual confirmations', (acronym, classification, pattern) => {
    expect(trial(acronym).eligibility.manualPending.some(line => pattern.test(line))).toBe(true);
    expect(evaluate(acronym, { classification }).pendingCriteria.some(line => pattern.test(line))).toBe(true);
  });
});

describe('criteria tables disclose a recruiting status confirmed ahead of the registry', () => {
  // CLARITY is shown as recruiting on the maintainer's confirmation; its registry record still reads NOT_YET_RECRUITING.
  const table = eligibilityTables.find(t => t.trials.some(entry => entry.acronym === 'CLARITY'));
  it('names the registry status in the HTML and Markdown exports', () => {
    for (const text of [buildTableHtml(table), buildTableMarkdown(table)]) {
      expect(text).toContain('CLARITY');
      expect(text).toContain('Recruiting (registry not yet updated; not yet recruiting at recorded check)');
    }
  });
  it('keeps the plain recruiting wording when the registry agrees', () => {
    const step = eligibilityTables.flatMap(t => t.trials).find(entry => entry.acronym === 'STEP');
    expect(step.registryStatus).toBe('RECRUITING');
    expect(buildTableMarkdown(eligibilityTables.find(t => t.trials.includes(step)))).toMatch(/STEP NCT\S+ · Recruiting at recorded check/);
  });
});
