import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const load = (id) => JSON.parse(readFileSync(new URL(`../src/guidelines/${id}.json`, import.meta.url), 'utf8'));
// Independently counted from source boxes, not from the app's projected row count.
// Each tuple is [PICO identifier, formal/no-recommendation count, consensus count].
const inventories = {
  'eso-ean-poststroke-cognition-2021': Array.from({ length: 18 }, (_, i) => [String(i + 1), i === 1 ? 3 : [13, 17].includes(i) ? 2 : 1, 1]),
  'eso-bp-2025': [['1', 1, 1], ['2', 1, 1], ['3', 2, 0], ['4', 4, 1], ['5', 1, 1], ['6', 1, 1], ['7', 1, 4], ['8', 1, 2]],
  'eso-sah-2026': [['1a', 1, 0], ['1b', 1, 2], ['2', 1, 1], ['3a', 1, 5], ['3b', 1, 3], ['4', 3, 0], ['5a', 1, 1], ['5b', 1, 3], ['6a', 1, 3], ['6b', 1, 5], ['7', 1, 6], ['8', 1, 1], ['9a', 1, 1], ['9b', 1, 1], ['10', 1, 5]],
  'eso-sap-2026': Array.from({ length: 15 }, (_, i) => [String(i + 1), i === 5 ? 2 : i === 6 ? 4 : 1, i === 5 ? 0 : i === 6 ? 4 : 1]),
  'eso-aphasia-rehab-2025': [['1', 1, 0], ['2', 1, 0], ['3', 1, 0], ['4a', 1, 0], ['4b', 1, 0], ['5a', 1, 0], ['5b', 1, 1], ['6(a–f)', 1, 1], ['7a', 1, 0], ['7b', 1, 0]],
  'eso-motor-rehab-2025': [['1', 1, 0], ['2', 1, 1], ['3', 2, 0], ['4', 1, 1], ['5', 1, 0], ['6', 1, 0]],
  'eso-visual-2025': Array.from({ length: 13 }, (_, i) => [String(i + 1), 1, [1, 2, 3, 4, 5, 9].includes(i) ? 2 : 0]),
};
const documents = Object.fromEntries(Object.keys(inventories).map((id) => [id, load(id)]));
const row = (id, pico, kind = 'recommendation', ordinal = 1) => documents[id].recommendations.find((r) => r.sourceStatementId === `PICO ${pico} ${kind} ${ordinal}`);

describe('complete ESO source inventories', () => {
  for (const [id, inventory] of Object.entries(inventories)) {
    it(`${id} accounts for every source question and statement separately`, () => {
      const d = documents[id];
      const expectedR = inventory.reduce((n, [, r]) => n + r, 0);
      const expectedC = inventory.reduce((n, [, , c]) => n + c, 0);
      expect(d.coverage).toMatchObject({ status: 'complete', scope: 'All formal recommendations and good-practice/consensus statements', checkedAt: '2026-09-06', sourceRecommendationCount: expectedR, sourceConsensusCount: expectedC });
      expect(d.coverage.sourceSections).toEqual(inventory.map(([p]) => `PICO ${p}`));
      expect(d.recommendations).toHaveLength(expectedR + expectedC);
      expect(d.extractionStatus).toBeUndefined();
      for (const [pico, formalCount, consensusCount] of inventory) {
        const actual = d.recommendations.filter((r) => r.sourceStatementId.startsWith(`PICO ${pico} `));
        expect(actual.filter((r) => r.sourceStatementType === 'recommendation'), `PICO ${pico} formal`).toHaveLength(formalCount);
        expect(actual.filter((r) => r.sourceStatementType === 'consensus'), `PICO ${pico} consensus`).toHaveLength(consensusCount);
        expect(d.coverage.inventory.find((r) => r.section === `PICO ${pico}`)).toMatchObject({ recommendationCount: formalCount, consensusCount });
      }
    });
  }

  it('retains unique locators and never lends evidence grades to consensus', () => {
    const all = Object.values(documents).flatMap((d) => d.recommendations);
    expect(all).toHaveLength(199);
    expect(new Set(all.map((r) => r.id)).size).toBe(all.length);
    for (const d of Object.values(documents)) {
      expect(new Set(d.recommendations.map((r) => r.sourceStatementId)).size).toBe(d.recommendations.length);
      for (const r of d.recommendations) {
        expect(r.sourceReference).toContain(r.sourceStatementId.split(' ').slice(0, 2).join(' '));
        expect(r.text.length).toBeGreaterThan(35);
        expect(r.text).not.toMatch(/source.only|source.not.machine.readable|not the published recommendation box/i);
        if (r.sourceStatementType === 'consensus') {
          expect(r.classOfRec).toBe('Expert Consensus');
          expect(r.levelOfEvidence).toBe('Ungraded');
        } else {
          expect(['Strong', 'Conditional', 'No recommendation']).toContain(r.classOfRec);
        }
      }
    }
  });
});

describe('source qualifications and grading regression checks', () => {
  it('applies the missing-box cognition correction to every restored statement', () => {
    const d = documents['eso-ean-poststroke-cognition-2021'];
    const correction = d.publicationUpdates.find((u) => u.pmid === '35300261');
    expect(correction.status).toBe('applied');
    expect(new Set(correction.affectedRecommendationIds)).toEqual(new Set(d.recommendations.map((r) => r.id)));
    expect(d.recommendations.every((r) => r.correctionSourceUrl === 'https://doi.org/10.1177/23969873221076951')).toBe(true);
  });

  it('limits cognition-prevention uncertainty to cognition and separates screening from diagnosis', () => {
    const id = 'eso-ean-poststroke-cognition-2021';
    expect(row(id, '2', 'recommendation', 1).text).toMatch(/solely.*cognitive/);
    expect(row(id, '2', 'recommendation', 2)).toMatchObject({ classOfRec: 'Conditional', classNote: 'Against' });
    expect(row(id, '2', 'recommendation', 2).text).toMatch(/lacunar/);
    expect(row(id, '2', 'consensus').text).toMatch(/vascular prevention.*blood pressure.*antithrombotics.*statins/);
    expect(row(id, '6').text).toMatch(/not clinician-directed/);
    expect(row(id, '7').text).toMatch(/post-acute.*comprehensive.*false positives.*lower threshold/);
    expect(row(id, '8').text).toMatch(/acute or post-acute.*miss/);
    expect(row(id, '18')).toMatchObject({ classOfRec: 'Conditional', levelOfEvidence: 'Moderate certainty' });
    expect(row(id, '18', 'recommendation', 2).classOfRec).toBe('No recommendation');
  });

  it('keeps mixed pathology and advanced dementia qualifications in cognition consensus', () => {
    const id = 'eso-ean-poststroke-cognition-2021';
    expect(row(id, '5', 'consensus').text).toMatch(/mild-to-moderate.*advanced dementia.*short life expectancy/);
    expect(row(id, '12', 'consensus').text).toMatch(/mixed.*Alzheimer.*Lewy body/);
    expect(row(id, '13', 'consensus').text).toMatch(/moderate-to-severe Alzheimer/);
    expect(row(id, '14', 'consensus').text).toMatch(/Avoid actovegin and cerebrolysin.*serious adverse/);
  });

  it('retains BP source thresholds and unequal certainty without inventing a new recommendation', () => {
    const id = 'eso-bp-2025';
    expect(row(id, '1')).toMatchObject({ classOfRec: 'Strong', classNote: 'Against', levelOfEvidence: 'Moderate certainty' });
    expect(row(id, '2').text).toContain('<220/110 mmHg');
    expect(row(id, '2', 'consensus').text).toMatch(/>220\/120.*<15%.*24 hours/);
    expect(row(id, '4', 'recommendation', 1)).toMatchObject({ classOfRec: 'Conditional', classNote: 'Against', levelOfEvidence: 'Very low certainty' });
    expect(row(id, '4', 'recommendation', 3)).toMatchObject({ classOfRec: 'Strong', classNote: 'Against', levelOfEvidence: 'High certainty' });
    expect(row(id, '4', 'recommendation', 3).text).toMatch(/<140.*24 hours.*successful thrombectomy/);
    expect(row(id, '4', 'consensus').text).toContain('mTICI 3');
    expect(row(id, '7').classOfRec).toBe('No recommendation');
    expect(row(id, '7', 'consensus', 2).text).toMatch(/>70.*110.*>220.*>30 mL/);
  });

  it('distinguishes SAH graded evidence from all 37 consensus statements including the truncated table tail', () => {
    const id = 'eso-sah-2026';
    expect(row(id, '3a')).toMatchObject({ classOfRec: 'Strong', levelOfEvidence: 'High certainty' });
    expect(row(id, '3a').text).toMatch(/WFNS I–III.*without adjunctive.*clipping/);
    expect(row(id, '4', 'recommendation', 3)).toMatchObject({ classOfRec: 'No recommendation', levelOfEvidence: 'Low certainty' });
    expect(row(id, '7', 'consensus', 4).text).toMatch(/Do not drain.*normal/);
    expect(row(id, '7', 'consensus', 6).text).toMatch(/permanent.*symptomatic chronic/i);
    expect(row(id, '9a', 'consensus').text).toMatch(/≥70.*remote.*≥35/);
    expect(row(id, '9b', 'consensus').text).toContain('>30');
    expect(row(id, '10', 'consensus', 4).text).toMatch(/other than coils.*at least 5 years.*regardless.*retreatment/);
    expect(row(id, '10', 'consensus', 5).text).toMatch(/5-year intervals.*de novo.*treatment remains/);
  });

  it('keeps pneumonia prevention outcomes and treatment decisions separate', () => {
    const id = 'eso-sap-2026';
    expect(row(id, '6', 'recommendation', 1)).toMatchObject({ classOfRec: 'Conditional', classNote: 'Against', levelOfEvidence: 'Very low certainty' });
    expect(row(id, '6', 'recommendation', 2)).toMatchObject({ classOfRec: 'Conditional', classNote: 'Against', levelOfEvidence: 'Moderate certainty' });
    expect(row(id, '6', 'recommendation', 1).text).toMatch(/non-ventilated.*7 days.*incidence/);
    expect(row(id, '3', 'consensus').text).toMatch(/afebrile.*30 and 40 mg\/L/);
    expect(row(id, '10', 'consensus').text).toMatch(/48 hours.*24 hours.*prolonged.*severe stroke/);
    expect(row(id, '12', 'consensus').text).toContain('at least 5 days');
    expect(row(id, '13', 'consensus').text).toMatch(/aspiration alone does not justify.*Pseudomonas.*>7 days/);
    expect(row(id, '14', 'consensus').text).toMatch(/few hours.*When feasible.*before antibiotics/);
  });

  it('retains aphasia therapy dose and the full trial-only stimulation consensus', () => {
    const id = 'eso-aphasia-rehab-2025';
    expect(row(id, '1')).toMatchObject({ classOfRec: 'Strong', levelOfEvidence: 'Low certainty' });
    expect(row(id, '1').text).toContain('20 total hours');
    expect(row(id, '2').text).toContain('3 hours per week');
    expect(row(id, '3').text).toContain('4 days per week');
    expect(row(id, '6(a–f)').classOfRec).toBe('No recommendation');
    expect(row(id, '6(a–f)', 'consensus').text).toMatch(/only in high-quality trials.*adverse-event.*10\/12.*12\/12/);
  });

  it('does not promote motor rehabilitation consensus or expand high-intensity walking eligibility', () => {
    const id = 'eso-motor-rehab-2025';
    expect(row(id, '2').classOfRec).toBe('No recommendation');
    expect(row(id, '4').classOfRec).toBe('No recommendation');
    expect(row(id, '2', 'consensus').text).toMatch(/≥20.*13\/17/);
    for (const n of [1, 2]) expect(row(id, '3', 'recommendation', n).text).toMatch(/chronic stroke with stable cardiovascular status/);
    expect(row(id, '3', 'recommendation', 1)).toMatchObject({ classOfRec: 'Strong', levelOfEvidence: 'Moderate certainty' });
    expect(row(id, '3', 'recommendation', 2)).toMatchObject({ classOfRec: 'Conditional', levelOfEvidence: 'Low certainty' });
  });

  it('preserves QUADAS-2 ratings and separates visual consensus from uncertain evidence', () => {
    const id = 'eso-visual-2025';
    expect(row(id, '1')).toMatchObject({ levelOfEvidence: 'Ungraded' });
    expect(row(id, '1').classNote).toMatch(/QUADAS-2 medium risk/);
    expect(row(id, '7').classNote).toMatch(/QUADAS-2 high risk/);
    expect(row(id, '2')).toMatchObject({ classOfRec: 'No recommendation', levelOfEvidence: 'Low certainty' });
    expect(row(id, '2', 'consensus')).toMatchObject({ classOfRec: 'Expert Consensus', levelOfEvidence: 'Ungraded' });
    expect(row(id, '10')).toMatchObject({ classOfRec: 'No recommendation', levelOfEvidence: 'Very low certainty' });
    expect(row(id, '11').text).toMatch(/total occlusion cautiously.*monocular/);
    expect(row(id, '9').text).toMatch(/2025.*4\.5 hours.*weak.*very-low-certainty/);
  });

  it('shows newer CRAO trial evidence separately without rewriting the historical source grade', () => {
    const r = row('eso-visual-2025', '9');
    expect(r).toMatchObject({ classOfRec: 'Conditional', levelOfEvidence: 'Very low certainty', currentEvidenceCheckedAt: '2026-09-06' });
    expect(r.currentEvidenceNote).toMatch(/2026-09-06.*THEIA.*underpowered.*TenCRAOS.*fatal intracranial.*historical.*current endorsement/);
    expect(r.currentEvidenceSources.map((s) => s.pmid)).toEqual(['41109232', '41604638']);
    for (const source of r.currentEvidenceSources) expect(source.url).toBe(`https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`);
  });
});
