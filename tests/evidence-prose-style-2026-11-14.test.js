// Evidence prose style and related-link labels, 2026-11-14 (copy audit copy-08, copy-11, link-14).
// App-authored Evidence prose uses US spelling, "mmHg", US dates and comma thousands, and one display
// form per instrument, matching the Encounter and Calculators UI. Verbatim guideline text
// (recommendations[].text) and published source titles keep their original wording and are not checked.
import { describe, expect, it } from 'vitest';
import { readClinicalReference } from '../scripts/reference-data.mjs';
import { parseWorkspaceRoute } from '../src/workspace-routing.js';
import { ENCOUNTER_TOOLS } from '../src/calculator-utilities.js';
import { calculatorDefinitions } from '../src/supplementary-calculator-definitions.js';

const data = readClinicalReference();
const topic = id => data.topics.find(record => record.id === id);
const study = id => data.studies.find(record => record.id === id);
const AUTHORED = ['title', 'summary', 'caution', 'question', 'population', 'comparison', 'result', 'limits', 'headline'];
const authored = [...data.topics, ...data.studies].flatMap(record => [
  ...AUTHORED.filter(field => typeof record[field] === 'string').map(field => [`${record.id}.${field}`, record[field]]),
  ...(record.consider || []).map((text, index) => [`${record.id}.consider[${index}]`, text]),
  ...(record.related || []).map((link, index) => [`${record.id}.related[${index}].label`, link.label])
]);
const offending = pattern => authored.filter(([, text]) => pattern.test(text)).map(([where]) => where);

describe('Evidence prose style (copy-11)', () => {
  it('uses US spellings in app-authored prose', () => {
    expect(offending(/\b(?:\w+-)?centres?\b|\blabell(?:ed|ing)\b|\benrolment\b|\bthrombolyse\b/i)).toEqual([]);
    expect(topic('acute-reperfusion').summary).toContain('Do not give IVT for mild non-disabling deficits: PRISMS');
    expect(topic('dizziness').caution).toContain('in a prospective single-center ED cohort of 75 patients');
    expect(topic('inpatient-care').consider[3]).toContain('in HeadSOAR (BMJ 2026; 67 centers in China; 1,368 patients)');
    expect(topic('recovery').caution).toContain('unless labeled CSBPR 2025');
    expect(topic('retinal-ischemia').consider[3]).toMatch(/encourages trial enrollment\.$/);
  });

  it('writes "mmHg" in authored prose and keeps "mm Hg" only in verbatim guideline text', () => {
    expect(offending(/mm Hg/)).toEqual([]);
    expect(topic('ich-management').recommendations.map(rec => rec.text).join(' ')).toContain('SBP to a target of 140 mm Hg');
    expect(topic('bp-prevention').summary).toContain('lowered BP by 12/5 mmHg and stroke by 43%, whereas perindopril alone (5/3 mmHg)');
  });

  it('uses US dates and comma thousands', () => {
    const months = 'January|February|March|April|May|June|July|August|September|October|November|December';
    expect(offending(new RegExp(`\\b\\d{1,2} (?:${months}) \\d{4}\\b`))).toEqual([]);
    expect(topic('antithrombotic-reversal').summary).toContain('withdrawn from the US market effective December 22, 2025');
    expect(study('annexa-i').limits).toContain('withdrawn from the US market effective December 22, 2025');
    expect(offending(/\bn ?= ?\d{4,}/)).toEqual([]);
    expect(topic('large-core-evt').consider[3]).toContain('IPD of 6 RCTs (n=1,886)');
  });
});

describe('instrument and tool names (copy-08, Evidence side)', () => {
  it('uses the Encounter and Calculators form of each instrument in authored prose', () => {
    expect(offending(/PC-ASPECTS|ABCD2|STOP-Bang|Hunt and Hess/)).toEqual([]);
    // Verbatim AHA text keeps its own form.
    expect(topic('basilar-occlusion').recommendations[0].text).toContain('PC-ASPECTS 6 or greater');
    expect(topic('minor-stroke-antiplatelets').recommendations[0].text).toContain('ABCD2 4 or greater');
  });

  it('labels each related link to a Calculators-tab tool with that tool\'s Calculators name', () => {
    const names = Object.fromEntries([...ENCOUNTER_TOOLS, ...calculatorDefinitions].map(tool => [tool.id, tool.name]));
    // Deliberate exceptions: agent- and trial-specific links paired with a sibling link into the same Encounter block.
    const paired = new Set(['thrombolytic-choice:#/encounter/tnk', 'ct-perfusion:#/encounter/dawn', 'evt-selection:#/encounter/dawn']);
    const mismatched = data.topics.flatMap(record => (record.related || []).flatMap(link => {
      const route = parseWorkspaceRoute(link.href);
      const name = ['encounter', 'tools'].includes(route.surface) && route.tool ? names[route.tool] : undefined;
      return name && name !== link.label && !paired.has(`${record.id}:${link.href}`) ? [`${record.id}: ${link.label} → ${name}`] : [];
    }));
    expect(mismatched).toEqual([]);
    expect(topic('tia-evaluation').related).toContainEqual({ label: 'Acute DAPT source screen', href: '#/encounter/dapt' });
    expect(topic('af-timing').related).toContainEqual({ label: 'Renal calculation', href: '#/encounter/crcl' });
    expect(topic('sah').related).toContainEqual({ label: 'Hunt–Hess grade', href: '#/tools/hunt-hess' });
    expect(topic('sleep-brain-health').related).toContainEqual({ label: 'STOP-BANG', href: '#/tools/stop-bang' });
    expect(topic('basilar-occlusion').related).toContainEqual({ label: 'pc-ASPECTS', href: '#/encounter/pc-aspects' });
  });
});

describe('ICH surgery cross-reference (link-14)', () => {
  it('links the ich-management card to the ICH surgery card it names', () => {
    const card = topic('ich-management');
    expect(card.consider[1]).toContain('(see the ICH surgery card)');
    expect(card.related).toContainEqual({ label: 'ICH surgical options', href: '#/evidence/ich-surgery' });
    expect(parseWorkspaceRoute('#/evidence/ich-surgery')).toEqual({ surface: 'evidence', focusId: 'ich-surgery' });
    expect(topic('ich-surgery').title).toBe('ICH: when to revisit surgical options');
  });
});
