import { describe, it, expect } from 'vitest';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import {
  CtpGhostCoreCard,
  VesselWallMriCard,
  CryptogenicStrokeEsusCard,
  PfoClosureCard,
  CerebralAmyloidAngiopathyCard
} from '../src/education.jsx';
import { citations } from '../src/evidence/citations.js';

describe('Domain 4: Diagnostic Algorithms, Neuroimaging Pearls & Cryptogenic Stroke', () => {
  const domain4Cards = [
    { id: 'ctp-ghost-core', Component: CtpGhostCoreCard, name: 'CTP Ghost Core' },
    { id: 'vessel-wall-mri', Component: VesselWallMriCard, name: 'Vessel Wall MRI' },
    { id: 'cryptogenic-stroke-esus', Component: CryptogenicStrokeEsusCard, name: 'Cryptogenic Stroke & ESUS' },
    { id: 'pfo-closure', Component: PfoClosureCard, name: 'PFO Closure & LAAO' },
    { id: 'cerebral-amyloid-angiopathy', Component: CerebralAmyloidAngiopathyCard, name: 'Cerebral Amyloid Angiopathy Boston 2.0' },
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

  describe('2. SVG Visualizer Dimensions & Accessibility (WCAG)', () => {
    domain4Cards.forEach(({ id, Component, name }) => {
      it(`verifies SVG in ${name} (${id}) has valid viewBox, role="img", and aria-label`, () => {
        const html = ReactDOMServer.renderToString(React.createElement(Component));
        expect(html).toContain('<svg');
        expect(html).toContain('viewBox="0 0 735 168"');
        expect(html).toContain('role="img"');
        expect(html).toContain('aria-label=');
      });
    });
  });

  describe('3. Clinical Content & Evidence Verification', () => {
    it('verifies CTP Ghost Core card contains core thresholds, HIR, and artifact pearls', () => {
      const html = ReactDOMServer.renderToString(React.createElement(CtpGhostCoreCard));
      expect(html).toContain('rCBF');
      expect(html).toContain('&lt;30%');
      expect(html).toContain('ADC');
      expect(html).toContain('&lt;620');
      expect(html).toContain('Tmax &gt;6s');
      expect(html).toContain('Tmax &gt;10s');
      expect(html).toContain('HIR');
      expect(html).toContain('Ghost Core');
      expect(html).toContain('Campbell');
      expect(html).toContain('Boned');
      expect(html).toContain('Carotid Stenosis');
      expect(html).toContain('Pseudo-Penumbra');
      expect(html).toContain('Bolus Truncation');
    });

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
      expect(html).toContain('CSF Pleocytosis');
      expect(html).toContain('Reversible');
      expect(html).toContain('Negative Remodeling');
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

    it('verifies PFO Closure card contains high-risk anatomy, trials, RoPE score, and PASCAL matrix', () => {
      const html = ReactDOMServer.renderToString(React.createElement(PfoClosureCard));
      expect(html).toContain('CLOSE');
      expect(html).toContain('REDUCE');
      expect(html).toContain('RESPECT');
      expect(html).toContain('DEFENSE-PFO');
      expect(html).toContain('Atrial Septal Aneurysm');
      expect(html).toContain('RoPE');
      expect(html).toContain('PASCAL');
      expect(html).toContain('PROTECT AF');
      expect(html).toContain('PRAGUE-17');
    });

    it('verifies CAA card contains Boston Criteria v2.0, cSS risk, amyloid spells, and trials', () => {
      const html = ReactDOMServer.renderToString(React.createElement(CerebralAmyloidAngiopathyCard));
      expect(html).toContain('Boston Criteria v2.0');
      expect(html).toContain('Charidimou');
      expect(html).toContain('Cortical Superficial Siderosis');
      expect(html).toContain('cSS');
      expect(html).toContain('Amyloid Spells');
      expect(html).toContain('TFNE');
      expect(html).toContain('PRESTIGE-AF');
      expect(html).toContain('SoSTART');
      expect(html).toContain('ENRICH-AF');
      expect(html).toContain('Centrum Semiovale');
      expect(html).toContain('Multispot');
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
