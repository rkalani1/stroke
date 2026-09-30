import { describe, it, expect } from 'vitest';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import Education, {
  VesselWallMriCard,
  CryptogenicStrokeEsusCard
} from '../src/education.jsx';
import { citations } from '../src/evidence/citations.js';

describe('Domain 4: Diagnostic Algorithms, Neuroimaging Pearls & Cryptogenic Stroke', () => {
  const domain4Cards = [
    { id: 'vessel-wall-mri', Component: VesselWallMriCard, name: 'Vessel Wall MRI' },
    { id: 'cryptogenic-stroke-esus', Component: CryptogenicStrokeEsusCard, name: 'Cryptogenic Stroke & ESUS' },
  ];

  describe('1. Card Rendering & HTML Integrity', () => {
    domain4Cards.forEach(({ id, Component, name }) => {
      it(`renders ${name} (${id}) without errors, NaN, or undefined`, () => {
        expect(Component).toBeDefined();
        const html = ReactDOMServer.renderToString(React.createElement(Component));
        expect(html).toBeTruthy();
        expect(html).not.toContain('NaN');
        expect(html).not.toContain('undefined');
        expect(html).not.toContain('[object Object]');
        expect(html).toContain('card-' + id);
      });
    });
  });

  describe('2. Reviewed replacements and accessible reading view', () => {
    domain4Cards.forEach(({ id, Component, name }) => {
      it(`keeps ${name} (${id}) readable after withdrawing the unsupported diagnostic schematic`, () => {
        const html = ReactDOMServer.renderToStaticMarkup(React.createElement(Component));
        expect(html).not.toContain('<svg');
        expect(html).toContain('Key clinical boundaries');
        // The comparison table remains reachable by keyboard after the figure removal.
        expect(html).toMatch(/class="clinical-scroll-region" role="region" aria-label="[^"]+" tabindex="0"><table/);
        expect(html).toContain('https://pubmed.ncbi.nlm.nih.gov/');

        const view = ReactDOMServer.renderToStaticMarkup(<Education activeSubTab={id} />);
        expect(view).toContain('education-card-reader education-card-readable');
        expect(view).toContain('aria-label="Teaching card display"');
        expect(view).toMatch(/<button[^>]*aria-pressed="true"[^>]*>Reading view<\/button>/);
        expect(view).toMatch(/<button[^>]*aria-pressed="false"[^>]*>Fit card<\/button>/);
      });
    });
  });

  describe('3. Clinical Content & Evidence Verification', () => {
    it('verifies Vessel Wall MRI card contains 5-arteriopathy differential matrix', () => {
      const html = ReactDOMServer.renderToString(React.createElement(VesselWallMriCard));
      expect(html).toContain('ICAD');
      expect(html).toContain('PACNS');
      expect(html).toContain('RCVS');
      expect(html).toContain('Dissection');
      expect(html).toContain('Moyamoya');
      expect(html).toContain('3.0T');
      expect(html).toContain('Black-Blood');
      expect(html).toContain('Eccentric');
      expect(html).toContain('Concentric');
      expect(html).toContain('Intraplaque Hemorrhage');
      expect(html).toContain('neither abnormal CSF nor response to immunosuppression establishes PACNS');
      expect(html).toContain('Do not use a categorical remodeling rule to establish or exclude RCVS');
      expect(html).toContain('Marked negative remodeling');
      expect(html).toContain('pattern is not universal or disease-specific');
    });

    it('verifies Cryptogenic Stroke & ESUS card contains trials, ICM yields, and atrial cardiopathy', () => {
      const html = ReactDOMServer.renderToString(React.createElement(CryptogenicStrokeEsusCard));
      expect(html).toContain('ESUS');
      expect(html).toContain('Hart');
      expect(html).toContain('NAVIGATE ESUS');
      expect(html).toContain('RE-SPECT ESUS');
      expect(html).toContain('ARCADIA');
      expect(html).toContain('CRYSTAL AF');
      expect(html).toContain('STROKE-AF');
      expect(html).toContain('30.0%');
      expect(html).toContain('Atrial Cardiopathy');
      expect(html).toContain('38324415'); // ARCADIA JAMA PMID
    });


  });

  describe('4. Landmark Citation Registry Verification', () => {
    const landmarkPmids = [
      { name: 'Ghost Core (Campbell 2012)', pmid: '22858726' },
      { name: 'VW-MRI ASNR (Mandell 2017)', pmid: '27469212' },
      { name: 'ESUS Construct (Hart 2014)', pmid: '24646875' },
      { name: 'CRYSTAL AF (Sanna 2014)', pmid: '24963567' },
      { name: 'STROKE-AF (Bernstein 2021)', pmid: '34061145' },
      { name: 'ARCADIA (Kamel 2024)', pmid: '38324415' },
      { name: 'CLOSE (Mas 2017)', pmid: '28902593' },
      { name: 'REDUCE (Sondergaard 2017)', pmid: '28902580' },
      { name: 'DEFENSE-PFO (Lee 2018)', pmid: '29544871' },
      { name: 'RoPE Score (Kent 2013)', pmid: '23864310' },
      { name: 'PASCAL Consensus (Kent 2021)', pmid: '34905030' },
      { name: 'Boston Criteria 2.0 (Charidimou 2022)', pmid: '35841910' },
      { name: 'PRESTIGE-AF (Polymeris 2025)', pmid: '40023176' },
      { name: 'SoSTART (Al-Shahi Salman 2021)', pmid: '34487722' }
    ];

    landmarkPmids.forEach(({ name, pmid }) => {
      it(`verifies landmark trial citation ${name} (PMID ${pmid}) exists and is verified in citations registry`, () => {
        const citation = citations.find(c => c.pmid === pmid);
        expect(citation, `PMID ${pmid} for ${name} not found in citations registry`).toBeDefined();
        expect(citation.verificationStatus).toMatch(/^verified-(pubmed|guideline)$/);
        expect(citation.url).toContain(pmid);
      });
    });
  });
});
